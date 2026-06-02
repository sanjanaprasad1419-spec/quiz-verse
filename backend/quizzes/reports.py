import io
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from quizzes.models import Quiz, QuizRegistration, QuizAttempt, FFFAnswer, HotseatAttempt, Question
from django.contrib.auth import get_user_model

User = get_user_model()

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render total page count
    along with running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header (Pages > 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "KAUN BANEGA CROREPATI - OVERALL PERFORMANCE REPORT")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Footer (All pages)
        self.drawString(54, 40, "Confidential • ITMU Quiz-Verse Platform")
        self.drawRightString(558, 40, f"Page {self._pageNumber} of {page_count}")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(54, 52, 558, 52)
        
        self.restoreState()


def generate_quiz_pdf_report(quiz_id):
    """
    Generates a beautifully designed, comprehensive PDF performance report for a Quiz.
    """
    quiz = Quiz.objects.select_related('created_by', 'host').get(id=quiz_id)
    
    # 1. Fetch statistics
    total_registered = quiz.registrations.count()
    prelim_attempts = list(QuizAttempt.objects.filter(quiz=quiz).select_related('student'))
    total_prelim_participants = len(prelim_attempts)
    
    # Top 30 who qualify for Round 2 FFF
    top_30_ids = quiz.top_30_selected or []
    top_30_users = {u.id: u for u in User.objects.filter(id__in=top_30_ids)}
    
    # Failed Round 1
    failed_round_1 = [att for att in prelim_attempts if att.student.id not in top_30_ids]
    failed_round_1_count = len(failed_round_1)
    
    # Hotseat Contestants
    hotseat_attempts = list(HotseatAttempt.objects.filter(quiz=quiz).select_related('student'))
    hotseat_players_ids = []
    
    p1 = quiz.hotseat_player_1
    p2 = quiz.hotseat_player_2
    p3 = quiz.hotseat_player_3
    
    if p1: hotseat_players_ids.append(p1.id)
    if p2: hotseat_players_ids.append(p2.id)
    if p3: hotseat_players_ids.append(p3.id)
    
    # Failed Round 2 (selected for top 30 but did not secure hotseat)
    failed_round_2_count = max(0, len(top_30_ids) - len(hotseat_players_ids))
    
    # Podium Ranking
    podium_list = []
    for att in hotseat_attempts:
        podium_list.append({
            'name': att.student.full_name,
            'email': att.student.email,
            'score': att.score,
            'status': att.get_status_display(),
            'lifelines': f"{'50:50 ' if att.lifeline_5050_used else ''}{'Poll ' if att.lifeline_poll_used else ''}{'Switch ' if att.lifeline_switch_used else ''}" or 'None'
        })
    
    # Sort podium by score descending
    podium_list.sort(key=lambda x: x['score'], reverse=True)
    
    # Buffer setup
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=64
    )
    
    styles = getSampleStyleSheet()
    
    # Custom elegant styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor("#1e3a8a"),  # Deep KBC Navy Blue
        spaceAfter=6,
        leading=28
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.HexColor("#b45309"),  # KBC Gold/Amber
        spaceAfter=15,
        leading=16
    )
    
    meta_label_style = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#334155")
    )
    
    meta_val_style = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor("#0f172a")
    )
    
    h1_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=colors.HexColor("#1e3a8a"),
        spaceBefore=18,
        spaceAfter=8,
        leading=18
    )
    
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor("#0f172a")
    )
    
    cell_regular = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor("#334155")
    )
    
    cell_header = ParagraphStyle(
        'CellHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )
    
    story = []
    
    # Title / Crest
    story.append(Paragraph("KAUN BANEGA CROREPATI", title_style))
    story.append(Paragraph(f"Official Performance Analysis • {quiz.title}", subtitle_style))
    
    # Event metadata block
    meta_data = [
        [
            Paragraph("Conducted By:", meta_label_style),
            Paragraph(quiz.created_by.full_name if quiz.created_by else 'N/A', meta_val_style),
            Paragraph("Event Date:", meta_label_style),
            Paragraph(quiz.event_date.strftime('%B %d, %Y at %I:%M %p') if quiz.event_date else 'TBA', meta_val_style),
        ],
        [
            Paragraph("Designated Host:", meta_label_style),
            Paragraph(quiz.host.full_name if quiz.host else (quiz.created_by.full_name if quiz.created_by else 'N/A'), meta_val_style),
            Paragraph("Report Generated:", meta_label_style),
            Paragraph(timezone.now().strftime('%B %d, %Y at %I:%M %p'), meta_val_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[110, 142, 110, 142])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LINEBELOW', (0,-1), (-1,-1), 1, colors.HexColor("#1e3a8a")),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # --- SECTION 1: EXEC SUMMARY ---
    story.append(Paragraph("1. Executive Summary", h1_style))
    
    summary_data = [
        [Paragraph("Metric Description", cell_header), Paragraph("Count / Value", cell_header)],
        [Paragraph("Total Registered Candidates", cell_regular), Paragraph(str(total_registered), cell_bold)],
        [Paragraph("Round 1 (Preliminary MCQ) Participants", cell_regular), Paragraph(str(total_prelim_participants), cell_bold)],
        [Paragraph("Round 1 Failures (Did not make FFF Batches)", cell_regular), Paragraph(str(failed_round_1_count), cell_bold)],
        [Paragraph("Round 2 (Fastest Finger First) Candidates", cell_regular), Paragraph(str(len(top_30_ids)), cell_bold)],
        [Paragraph("Round 2 Failures (Did not secure Hotseat)", cell_regular), Paragraph(str(failed_round_2_count), cell_bold)],
        [Paragraph("Total Contestants Promoted to Hotseat", cell_regular), Paragraph(str(len(hotseat_attempts)), cell_bold)],
    ]
    summary_table = Table(summary_data, colWidths=[350, 154])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 15))
    
    # --- SECTION 2: PODIUM STANDINGS ---
    story.append(Paragraph("2. Hotseat Podium Standings", h1_style))
    if not podium_list:
        story.append(Paragraph("No contestants reached the hotseat or competed in this event yet.", cell_regular))
    else:
        podium_rows = [
            [
                Paragraph("Rank", cell_header),
                Paragraph("Contestant Name", cell_header),
                Paragraph("Final Score (Points)", cell_header),
                Paragraph("Status", cell_header),
                Paragraph("Lifelines Used", cell_header)
            ]
        ]
        for idx, item in enumerate(podium_list, start=1):
            rank_label = "🏆 1st" if idx == 1 else ("🥈 2nd" if idx == 2 else ("🥉 3rd" if idx == 3 else f"{idx}th"))
            podium_rows.append([
                Paragraph(rank_label, cell_bold),
                Paragraph(item['name'], cell_bold if idx == 1 else cell_regular),
                Paragraph(f"{item['score']:,}", cell_bold),
                Paragraph(item['status'], cell_regular),
                Paragraph(item['lifelines'], cell_regular),
            ])
            
        podium_table = Table(podium_rows, colWidths=[65, 140, 110, 85, 104])
        podium_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#b45309")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#fffbeb"), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#fcd34d")),
            ('TOPPADDING', (0,0), (-1,-1), 7),
            ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ]))
        story.append(podium_table)
    
    story.append(PageBreak())
    
    # --- SECTION 3: FASTEST FINGER FIRST LEADERBOARD ---
    story.append(Paragraph("3. Fastest Finger First (FFF) Performance", h1_style))
    fff_answers = list(FFFAnswer.objects.filter(quiz=quiz).select_related('student', 'question').order_by('batch_number', 'time_taken_seconds'))
    
    if not fff_answers:
        story.append(Paragraph("No Fastest Finger First records found for this event.", cell_regular))
    else:
        fff_rows = [
            [
                Paragraph("Batch", cell_header),
                Paragraph("Contestant Name", cell_header),
                Paragraph("Is Correct", cell_header),
                Paragraph("Time Taken (s)", cell_header),
                Paragraph("Sequence Submitted", cell_header)
            ]
        ]
        for f in fff_answers:
            fff_rows.append([
                Paragraph(f"Batch {f.batch_number}", cell_regular),
                Paragraph(f.student.full_name, cell_bold),
                Paragraph("✅ YES" if f.is_correct else "❌ NO", cell_bold if f.is_correct else cell_regular),
                Paragraph(f"{f.time_taken_seconds:.3f}s", cell_bold),
                Paragraph(f.submitted_sequence or 'N/A', cell_regular),
            ])
            
        fff_table = Table(fff_rows, colWidths=[60, 140, 75, 95, 134])
        fff_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e3a8a")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f8fafc"), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(fff_table)
    story.append(Spacer(1, 15))
    
    # --- SECTION 4: PRELIMINARY ROUND LEADERBOARD ---
    story.append(Paragraph("4. Preliminary MCQ Leaderboard", h1_style))
    sorted_prelims = sorted(prelim_attempts, key=lambda x: (x.score, -(x.completed_at - x.started_at).total_seconds() if x.completed_at else 0), reverse=True)
    
    if not sorted_prelims:
        story.append(Paragraph("No preliminary attempts logged yet.", cell_regular))
    else:
        prelim_rows = [
            [
                Paragraph("Rank", cell_header),
                Paragraph("Candidate Name", cell_header),
                Paragraph("College ID", cell_header),
                Paragraph("Email ID", cell_header),
                Paragraph("Prelim Score", cell_header)
            ]
        ]
        for idx, att in enumerate(sorted_prelims, start=1):
            prelim_rows.append([
                Paragraph(f"#{idx}", cell_bold),
                Paragraph(att.student.full_name, cell_bold if idx <= 10 else cell_regular),
                Paragraph(att.student.college_id, cell_regular),
                Paragraph(att.student.email, cell_regular),
                Paragraph(f"{att.score} pts", cell_bold),
            ])
            
        prelim_table = Table(prelim_rows, colWidths=[45, 145, 95, 145, 74])
        prelim_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#1e293b")),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#f1f5f9"), colors.white]),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('TOPPADDING', (0,0), (-1,-1), 5),
            ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(prelim_table)
        
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()
