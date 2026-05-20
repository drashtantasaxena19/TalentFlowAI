import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromFile = async (file) => {
    try {
        if (!file) return "";

        const extension = file.name.split(".").pop()?.toLowerCase();

        if (extension === "txt") {
            return await file.text();
        }

        if (extension === "docx") {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            return result.value || "";
        }

        if (extension === "pdf") {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            let text = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const content = await page.getTextContent();
                text += " " + content.items.map((item) => item.str).join(" ");
            }

            return text.trim();
        }

        return "";
    } catch (error) {
        console.error("Text extraction failed:", error);
        return "";
    }
};