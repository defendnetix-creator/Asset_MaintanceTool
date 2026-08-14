#!/usr/bin/env python3
"""Generate PDF from markdown using reportlab"""
import sys
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

def main():
    root = Path(__file__).parent.parent
    md_path = root / 'docs' / 'prd' / 'source' / 'PRD-TECHNICAL-v1.0.0.md'
    pdf_path = root / 'docs' / 'prd' / 'pdf' / 'PRD-TECHNICAL-v1.0.0.pdf'
    
    doc = SimpleDocTemplate(str(pdf_path), pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    for line in lines:
        stripped = line.rstrip('\n')
        if stripped.startswith('#'):
            level = len(stripped) - len(stripped.lstrip('#'))
            text = stripped.lstrip('#').strip()
            if level == 1:
                story.append(Paragraph(text, styles['Heading1']))
                story.append(Spacer(1, 12))
            elif level == 2:
                story.append(Paragraph(text, styles['Heading2']))
                story.append(Spacer(1, 12))
            elif level == 3:
                story.append(Paragraph(text, styles['Heading3']))
                story.append(Spacer(1, 12))
            else:
                story.append(Paragraph(text, styles['Normal']))
                story.append(Spacer(1, 6))
        else:
            if stripped == '':
                story.append(Spacer(1, 12))
            else:
                story.append(Paragraph(stripped, styles['Normal']))
                story.append(Spacer(1, 6))
    
    doc.build(story)
    print(f'Technical PDF generated at {pdf_path}')

if __name__ == '__main__':
    main()