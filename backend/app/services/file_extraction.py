import io
from fastapi import UploadFile, HTTPException


def extract_text_from_file(file: UploadFile) -> str:
    filename = file.filename or ""
    try:
        content = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Failed to read file: {str(e)}"
        )

    if filename.lower().endswith(".pdf"):
        try:
            return extract_text_from_pdf(content)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from PDF file: {str(e)}"
            )
    elif filename.lower().endswith(".docx"):
        try:
            return extract_text_from_docx(content)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to extract text from Word document: {str(e)}"
            )
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload a PDF or DOCX file."
        )


def extract_text_from_pdf(content: bytes) -> str:
    import fitz  # PyMuPDF

    text = ""
    doc = fitz.open(stream=content, filetype="pdf")
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def extract_text_from_docx(content: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(content))
    text = "\n".join(p.text for p in doc.paragraphs)
    return text.strip()