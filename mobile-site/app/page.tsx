import m01 from "../clinical-data/prescriptions/RX-M01-BED-MULTICOMPONENT.approved.json";
import m07 from "../clinical-data/prescriptions/RX-M07-GRADED-ACTIVITY.approved.json";
import m08 from "../clinical-data/prescriptions/RX-M08-TASK-PRACTICE.approved.json";
import focusedVariants from "../clinical-data/prescription-proposals/focused-variants.v0.1.0.json";
import { MobileAssessment } from "./mobile-assessment";

export default function Home() { return <MobileAssessment prescriptions={[m01, m07, m08]} proposals={focusedVariants.proposals} />; }
