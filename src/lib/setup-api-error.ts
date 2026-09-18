import { z } from "zod";
import { BodyLimitError, apiError } from "@/lib/http";
import { InvitationError } from "@/lib/invitations";
import { OriginError } from "@/lib/origin";
import {
  RateLimitError,
  RateLimitUnavailableError,
  rateLimitUnavailableResponse,
  rateLimitedResponse,
} from "@/lib/rate-limit";

export const SETUP_UNAVAILABLE_MESSAGE = "Die Einrichtung ist vorübergehend nicht möglich.";

export function setupApiErrorResponse(error: unknown): Response {
  if (error instanceof OriginError) return apiError(error.message, 403);
  if (error instanceof RateLimitError) return rateLimitedResponse(error);
  if (error instanceof RateLimitUnavailableError) return rateLimitUnavailableResponse();
  if (error instanceof BodyLimitError) return apiError(error.message, 413);
  if (error instanceof z.ZodError) return apiError("Bitte prüfen Sie Ihre Angaben.", 400);
  if (error instanceof InvitationError) return apiError(error.message, 400);
  return apiError(SETUP_UNAVAILABLE_MESSAGE, 500);
}
