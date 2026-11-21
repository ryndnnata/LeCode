import { buildGuideRows, buildTemplateRows } from "./question-import";

const COLUMN_WIDTHS = [
  12, 34, 24, 20, 11, 7, 48, 40, 30, 22, 22, 22, 22, 22, 14, 18, 40, 40, 40, 10,
];

export async function downloadQuestionTemplate(lessons: { slug: string; title: string }[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();

  const soalSheet = XLSX.utils.aoa_to_sheet(buildTemplateRows(lessons));
  soalSheet["!cols"] = COLUMN_WIDTHS.map((wch) => ({ wch }));

  const guideSheet = XLSX.utils.aoa_to_sheet(buildGuideRows(lessons));
  guideSheet["!cols"] = [{ wch: 26 }, { wch: 78 }];

  XLSX.utils.book_append_sheet(workbook, soalSheet, "Soal");
  XLSX.utils.book_append_sheet(workbook, guideSheet, "Petunjuk");
  XLSX.writeFile(workbook, "template-impor-soal-lecode.xlsx");
}
