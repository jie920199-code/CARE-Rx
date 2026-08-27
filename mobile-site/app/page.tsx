import m01 from "../clinical-data/prescriptions/RX-M01-BED-MULTICOMPONENT.approved.json";
import m07 from "../clinical-data/prescriptions/RX-M07-GRADED-ACTIVITY.approved.json";
import m08 from "../clinical-data/prescriptions/RX-M08-TASK-PRACTICE.approved.json";
import approvedFocusedVariants from "../clinical-data/prescriptions/focused-variants.v1.0.0.approved.json";
import focusedVariantProposals from "../clinical-data/prescription-proposals/focused-variants.v0.1.0.json";
import { MobileAssessment } from "./mobile-assessment";

type Prescription = Record<string, any>;

const comprehensivePrescriptions: Prescription[] = [m01, m07, m08];

const focusedPrescriptions = approvedFocusedVariants.prescriptions.map((variant) => {
  const parent = comprehensivePrescriptions.find((item) => item.prescriptionId === variant.sourcePrescriptionId);
  if (!parent || parent.version !== variant.sourcePrescriptionVersion) {
    throw new Error(`Approved source prescription not found for ${variant.prescriptionId}`);
  }

  return {
    ...parent,
    ...variant,
    applicableModules: [variant.module],
    steps: variant.stepIndexes.map((index) => parent.steps[index]),
    clinicalReview: approvedFocusedVariants.clinicalReview,
    inheritance: {
      policy: approvedFocusedVariants.inheritancePolicy,
      sourcePrescriptionId: parent.prescriptionId,
      sourcePrescriptionVersion: parent.version,
    },
  };
});

export default function Home() {
  const approvedIds = new Set(focusedPrescriptions.map((item) => item.prescriptionId));
  const pendingProposals = focusedVariantProposals.proposals.filter(
    (item) => !approvedIds.has(item.prescriptionId),
  );

  return <MobileAssessment prescriptions={[...comprehensivePrescriptions, ...focusedPrescriptions]} proposals={pendingProposals} />;
}
