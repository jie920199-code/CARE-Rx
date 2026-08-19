import { SafeFailure } from "../domain/errors.mjs";

const ALLOWED_AUDIENCES = new Set(["therapist", "caregiver", "resident_family"]);

export function assertExportAllowed({ session, safetyStatus, prescriptions, audience }) {
  if (!session?.therapistConfirmed) {
    throw new SafeFailure("THERAPIST_CONFIRMATION_REQUIRED", "Therapist confirmation is required before export.");
  }
  if (safetyStatus !== "eligible_for_matching") {
    throw new SafeFailure("SAFETY_STATUS_NOT_ELIGIBLE", "Safety status does not allow prescription export.", { safetyStatus });
  }
  if (!ALLOWED_AUDIENCES.has(audience)) {
    throw new SafeFailure("EXPORT_AUDIENCE_INVALID", "Export audience is invalid.");
  }
  if (!Array.isArray(prescriptions) || prescriptions.length === 0) {
    throw new SafeFailure("EXPORT_CONTENT_EMPTY", "At least one approved prescription is required.");
  }
  const unapproved = prescriptions.find(
    (prescription) => prescription.status !== "approved" || prescription.clinicalReview?.status !== "approved",
  );
  if (unapproved) {
    throw new SafeFailure("CLINICAL_CONTENT_NOT_APPROVED", "Unapproved clinical content cannot be exported.", {
      prescriptionId: unapproved.prescriptionId,
    });
  }

  return Object.freeze({
    allowed: true,
    audience,
    therapistUserId: session.therapistUserId,
    prescriptionVersions: Object.freeze(
      prescriptions.map((prescription) => `${prescription.prescriptionId}@${prescription.version}`),
    ),
  });
}
