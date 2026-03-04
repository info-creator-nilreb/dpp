declare module "pdfkit" {
  interface PDFDocumentOptions {
    margin?: number
    size?: "A4" | "LETTER" | string
  }
  class PDFDocument {
    constructor(options?: PDFDocumentOptions)
    on(event: "data" | "end" | "error", cb: (chunk?: Buffer) => void): this
    image(
      src: Buffer | string,
      x: number,
      y: number,
      options?: { width?: number; height?: number; fit?: [number, number] }
    ): this
    fontSize(size: number): this
    fillColor(color: string): this
    text(text: string, x?: number, y?: number, options?: { width?: number; align?: "left" | "right" | "center" }): this
    moveTo(x: number, y: number): this
    lineTo(x: number, y: number): this
    strokeColor(color: string): this
    stroke(): this
    moveDown(n?: number): this
    end(): void
    page: { height: number }
  }
  export = PDFDocument
}
