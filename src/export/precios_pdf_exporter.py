"""Small dependency-free PDF renderer for normalized price tables."""

from __future__ import annotations

from datetime import datetime
from typing import Any


class PricesPdfExporter:
    PAGE_LINES = 48

    def render(self, export: dict[str, Any]) -> tuple[str, bytes]:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"lista_precios_cotizador_{timestamp}.pdf"
        lines = [
            "LISTA DE PRECIOS GENERADA POR COTIZADOR DIGITAL",
            f"Generado: {export['metadata']['generado_en']}",
            "Precios sin IVA",
            "Export generado desde matrices internas del sistema",
            "",
            "INDICE",
        ]
        lines.extend(f"- {table['titulo']} [{table['estado']}]" for table in export["tablas"])
        for table in export["tablas"]:
            lines.extend(["", f"=== {table['titulo']} ===", f"Estado: {table['estado']}", f"Fuente: {table['fuente']}"])
            if table["estado"] != "activo":
                lines.append(table.get("motivo", "Bloqueado"))
                continue
            lines.append(" | ".join(table["columnas"]))
            for row in table["filas"]:
                lines.extend(self._wrap(" | ".join(self._format(value) for value in row), 115))
        pages = [lines[index:index + self.PAGE_LINES] for index in range(0, len(lines), self.PAGE_LINES)]
        return filename, self._make_pdf(pages)

    @staticmethod
    def _format(value: Any) -> str:
        if value is None:
            return "-"
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value)

    @staticmethod
    def _wrap(text: str, width: int) -> list[str]:
        return [text[index:index + width] for index in range(0, max(len(text), 1), width)]

    def _make_pdf(self, pages: list[list[str]]) -> bytes:
        objects: list[bytes] = []
        font_id = 3
        page_ids = [4 + index * 2 for index in range(len(pages))]
        content_ids = [page_id + 1 for page_id in page_ids]
        objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
        kids = " ".join(f"{page_id} 0 R" for page_id in page_ids)
        objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode())
        objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
        for page_number, (page_id, content_id, page_lines) in enumerate(zip(page_ids, content_ids, pages), start=1):
            objects.append(
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 {font_id} 0 R >> >> /Contents {content_id} 0 R >>".encode()
            )
            display_lines = list(page_lines) + ["", f"Precios sin IVA - generado desde Cotizador Digital - Página {page_number}/{len(pages)}"]
            commands = ["BT", "/F1 7 Tf", "28 565 Td", "10 TL"]
            for line in display_lines:
                commands.append(f"({self._escape(line)}) Tj")
                commands.append("T*")
            commands.append("ET")
            stream = "\n".join(commands).encode("latin-1", errors="replace")
            objects.append(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
        output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
        offsets = [0]
        for index, obj in enumerate(objects, start=1):
            offsets.append(len(output))
            output.extend(f"{index} 0 obj\n".encode())
            output.extend(obj)
            output.extend(b"\nendobj\n")
        xref = len(output)
        output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
        for offset in offsets[1:]:
            output.extend(f"{offset:010d} 00000 n \n".encode())
        output.extend(f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
        return bytes(output)

    @staticmethod
    def _escape(text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
