import axios from "axios";
import { ExtractionEngine, ExtractionStatus, NotificationType, ResumeSource } from "@prisma/client";
import { prisma } from "../config/database";
import { uploadResumeBuffer } from "./cloudinary.service";
import { getTaxonomyForExtraction } from "./skills.service";
import { tryExtractWithClaude } from "./claude.service";
import { extractWithFallbackWorker, WorkerExtractionResult } from "./resumeWorker.service";
import { computeResumeScore } from "./scoring.service";
import { generateSuggestions } from "./suggestions.service";
import { notify, notifyAdmins } from "./notification.service";
import { logger } from "../utils/logger";

interface ProcessResumeParams {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  ownerAccountId?: string;
  clientId?: string;
  externalUserRef?: string;
  source: ResumeSource;
}

/**
 * The full pipeline described in the project brief:
 *   PDF -> Extractor (Claude, falling back to the Python worker) -> Skill
 *   Database (matched + categorized) -> Score -> persisted + realtime
 *   notification (+ webhook if this came through a client's integration).
 */
export async function processResume(params: ProcessResumeParams) {
  const { fileBuffer, fileName, mimeType, ownerAccountId, clientId, externalUserRef, source } = params;

  const { url: cloudinaryUrl, publicId: cloudinaryPublicId } = await uploadResumeBuffer(fileBuffer, fileName);

  const resume = await prisma.resume.create({
    data: {
      ownerAccountId,
      clientId,
      externalUserRef,
      source,
      originalFileName: fileName,
      cloudinaryUrl,
      cloudinaryPublicId,
      fileSizeBytes: fileBuffer.length,
      mimeType,
      extractionStatus: ExtractionStatus.PROCESSING,
    },
  });

  try {
    const taxonomy = await getTaxonomyForExtraction();

    let extraction: WorkerExtractionResult | null = await tryExtractWithClaude(fileBuffer, mimeType, taxonomy);
    let engine: ExtractionEngine = ExtractionEngine.CLAUDE_LLM;

    if (!extraction) {
      extraction = await extractWithFallbackWorker(fileBuffer, fileName, mimeType, taxonomy);
      engine = ExtractionEngine.FALLBACK_WORKER;
    }

    await persistExtraction(resume.id, extraction, engine);

    const score = computeResumeScore(extraction);
    await prisma.scoreResult.create({
      data: {
        resumeId: resume.id,
        overallScore: score.overallScore,
        completenessScore: score.completenessScore,
        skillsScore: score.skillsScore,
        experienceScore: score.experienceScore,
        formattingScore: score.formattingScore,
        keywordScore: score.keywordScore,
        breakdown: score.breakdown as object,
      },
    });

    const suggestions = generateSuggestions(extraction, score);
    if (suggestions.length > 0) {
      await prisma.suggestion.createMany({
        data: suggestions.map((s, i) => ({ resumeId: resume.id, ...s, order: i })),
      });
    }

    await prisma.resume.update({
      where: { id: resume.id },
      data: { extractionStatus: ExtractionStatus.COMPLETED, extractionEngine: engine },
    });

    if (ownerAccountId) {
      await notify({
        accountId: ownerAccountId,
        type: NotificationType.RESUME_PROCESSED,
        title: "Resume analysis complete",
        message: `Your resume "${fileName}" scored ${score.overallScore}/100.`,
        metadata: { resumeId: resume.id, score: score.overallScore },
      });
    }
    await notifyAdmins("admin:resume-processed", { resumeId: resume.id, engine, score: score.overallScore });

    if (clientId) {
      await deliverWebhookIfConfigured(clientId, resume.id);
    }

    return { resumeId: resume.id, score, engine };
  } catch (err) {
    logger.error("Resume processing failed", { resumeId: resume.id, error: (err as Error).message });
    await prisma.resume.update({
      where: { id: resume.id },
      data: { extractionStatus: ExtractionStatus.FAILED, extractionError: (err as Error).message },
    });
    if (ownerAccountId) {
      await notify({
        accountId: ownerAccountId,
        type: NotificationType.RESUME_FAILED,
        title: "Resume analysis failed",
        message: `We couldn't process "${fileName}". Please try re-uploading it.`,
        metadata: { resumeId: resume.id },
      });
    }
    throw err;
  }
}

async function persistExtraction(resumeId: string, extraction: WorkerExtractionResult, engine: ExtractionEngine) {
  await prisma.extractedProfile.create({
    data: {
      resumeId,
      fullName: extraction.contact.full_name,
      email: extraction.contact.email,
      phone: extraction.contact.phone,
      linkedinUrl: extraction.contact.linkedin_url,
      githubUrl: extraction.contact.github_url,
      portfolioUrl: extraction.contact.portfolio_url,
      headline: extraction.headline,
      summary: extraction.summary,
      country: extraction.location.country,
      countryCode: extraction.location.country_code,
      state: extraction.location.state,
      city: extraction.location.city,
      postalCode: extraction.location.postal_code,
      totalExperienceYears: extraction.total_experience_years,
      confidenceScore: extraction.confidence_score,
      twitterUrl: extraction.contact.twitter_url,
      allEmails: extraction.contact.all_emails,
      allPhones: extraction.contact.all_phones,
    },
  });

  if (extraction.experiences.length > 0) {
    await prisma.experience.createMany({
      data: extraction.experiences.map((e, i) => ({
        resumeId,
        company: e.company,
        title: e.title,
        location: e.location,
        startDate: e.start_date ? new Date(e.start_date) : null,
        endDate: e.end_date ? new Date(e.end_date) : null,
        isCurrent: e.is_current,
        description: e.description,
        order: i,
      })),
    });
  }

  if (extraction.educations.length > 0) {
    await prisma.education.createMany({
      data: extraction.educations.map((e, i) => ({
        resumeId,
        institution: e.institution,
        degree: e.degree,
        fieldOfStudy: e.field_of_study,
        startDate: e.start_date ? new Date(e.start_date) : null,
        endDate: e.end_date ? new Date(e.end_date) : null,
        grade: e.grade,
        order: i,
      })),
    });
  }

  if (extraction.skills.length > 0) {
    await prisma.resumeSkill.createMany({
      data: extraction.skills.map((s) => ({
        resumeId,
        skillId: s.skill_id,
        proficiency: s.proficiency as never,
        yearsOfUse: s.years_of_use,
        mentionCount: s.mention_count,
        sourceContext: s.source_context,
      })),
      skipDuplicates: true,
    });
  }

  if (extraction.certifications?.length > 0) {
    await prisma.certification.createMany({
      data: extraction.certifications.map((c) => ({
        resumeId,
        name: c.name,
        issuer: c.issuer,
        issueDate: c.issue_date ? new Date(c.issue_date) : null,
        expiryDate: c.expiry_date ? new Date(c.expiry_date) : null,
        credentialId: c.credential_id,
      })),
    });
  }

  if (extraction.projects?.length > 0) {
    await prisma.resumeProject.createMany({
      data: extraction.projects.map((p) => ({
        resumeId,
        name: p.name,
        description: p.description,
        technologies: p.technologies,
        url: p.url,
      })),
    });
  }

  if (extraction.languages?.length > 0) {
    await prisma.resumeLanguage.createMany({
      data: extraction.languages.map((l) => ({ resumeId, name: l.name, proficiency: l.proficiency })),
    });
  }

  if (extraction.awards?.length > 0) {
    await prisma.resumeAward.createMany({
      data: extraction.awards.map((a) => ({
        resumeId,
        title: a.title,
        issuer: a.issuer,
        date: a.date ? new Date(a.date) : null,
        description: a.description,
      })),
    });
  }

  if (extraction.publications?.length > 0) {
    await prisma.resumePublication.createMany({
      data: extraction.publications.map((p) => ({
        resumeId,
        title: p.title,
        publisher: p.publisher,
        date: p.date ? new Date(p.date) : null,
        url: p.url,
      })),
    });
  }

  await prisma.resume.update({
    where: { id: resumeId },
    data: {
      rawText: extraction.raw_text || undefined,
      atsIssues: extraction.ats_issues as object,
      careerInsights: (extraction.career_insights ?? undefined) as object | undefined,
      detectedLanguage: extraction.detected_language,
      workMode: extraction.location.work_mode,
    },
  });
}

/**
 * Client integrations (Greenhouse-style: their own users fill out a form on
 * THEIR site, which posts the resume through our API) can register a
 * webhookUrl to be notified the moment extraction finishes, instead of
 * polling. This is what makes Scanza usable as a true "middleman" service.
 */
async function deliverWebhookIfConfigured(clientId: string, resumeId: string) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client?.webhookUrl) return;

  const fullResume = await prisma.resume.findUnique({
    where: { id: resumeId },
    include: {
      profile: true, skills: { include: { skill: true } }, experiences: true, educations: true,
      scoreResult: true, suggestions: true, certifications: true, projects: true, languages: true,
      awards: true, publications: true,
    },
  });

  try {
    await axios.post(client.webhookUrl, { event: "resume.processed", data: fullResume }, { timeout: 10_000 });
  } catch (err) {
    logger.warn("Client webhook delivery failed", { clientId, error: (err as Error).message });
  }
}
