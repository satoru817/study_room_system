import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { StudyRoom } from '../../constant/types';

type Props = {
    studyRoom: StudyRoom;
};

const StudyRoomQRCode: React.FC<Props> = ({ studyRoom }) => {
    const printAreaRef = useRef<HTMLDivElement>(null);

    // QRコードには自習室IDだけを含める
    const generateQRData = () => {
        return studyRoom.studyRoomId.toString();
    };

    // PDF生成（座席数分のQRコードを並べる）
    const handlePrintPDF = async () => {
        try {
            // A4サイズのPDFを作成
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // 1ページあたり12個（3列 × 4行）のQRコードを配置
            const qrPerRow = 3;
            const qrPerPage = 12;
            const qrSize = 50; // QRコードのサイズ (mm)
            const margin = 15;
            const spacing = (210 - margin * 2 - qrSize * qrPerRow) / (qrPerRow - 1); // A4幅 = 210mm

            const totalPages = Math.ceil(studyRoom.roomLimit / qrPerPage);

            for (let page = 0; page < totalPages; page++) {
                if (page > 0) {
                    pdf.addPage();
                }

                const startIndex = page * qrPerPage;
                const endIndex = Math.min(startIndex + qrPerPage, studyRoom.roomLimit);

                // ページタイトル
                pdf.setFontSize(16);
                pdf.text(`${studyRoom.name} - 座席QRコード (${page + 1}/${totalPages})`, 105, 10, {
                    align: 'center',
                });

                for (let i = startIndex; i < endIndex; i++) {
                    const relativeIndex = i - startIndex;
                    const row = Math.floor(relativeIndex / qrPerRow);
                    const col = relativeIndex % qrPerRow;

                    const x = margin + col * (qrSize + spacing);
                    const y = 20 + row * (qrSize + 20);

                    // 一時的なDIVにQRコードを描画
                    const tempDiv = document.createElement('div');
                    tempDiv.style.position = 'absolute';
                    tempDiv.style.left = '-9999px';
                    document.body.appendChild(tempDiv);

                    const qrContainer = document.createElement('div');
                    qrContainer.innerHTML = `
                        <div style="text-align: center; padding: 10px; border: 1px solid #ccc; background: white;">
                            <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">座席 ${i + 1}</div>
                            <div id="qr-${i}"></div>
                            <div style="font-size: 12px; margin-top: 5px;">${studyRoom.name}</div>
                        </div>
                    `;
                    tempDiv.appendChild(qrContainer);

                    // QRコードを生成
                    const qrElement = document.getElementById(`qr-${i}`);
                    if (qrElement) {
                        const qrCode = document.createElement('canvas');
                        const QRCode = (await import('qrcode')).default;
                        await QRCode.toCanvas(qrCode, generateQRData(), {
                            width: 200,
                            margin: 1,
                        });
                        qrElement.appendChild(qrCode);
                    }

                    // canvasに変換してPDFに追加
                    const canvas = await html2canvas(qrContainer, {
                        scale: 2,
                        backgroundColor: '#ffffff',
                    });

                    const imgData = canvas.toDataURL('image/png');
                    pdf.addImage(imgData, 'PNG', x, y, qrSize, qrSize);

                    // クリーンアップ
                    document.body.removeChild(tempDiv);
                }
            }

            // PDFを保存
            pdf.save(`${studyRoom.name}_QRコード_${studyRoom.roomLimit}席.pdf`);
        } catch (error) {
            console.error('PDF生成に失敗しました:', error);
            alert('PDF生成に失敗しました');
        }
    };

    return (
        <div className="qr-code-generator">
            <div className="card">
                <div className="card-body">
                    <h5 className="card-title">QRコード</h5>
                    <p className="text-muted">
                        このQRコードを生徒が読み込むと、{studyRoom.name}
                        への入退室記録ができます。
                    </p>

                    {/* プレビュー用の1つのQRコード */}
                    <div className="text-center mb-3" ref={printAreaRef}>
                        <div className="d-inline-block p-3 border rounded bg-white">
                            <div className="fw-bold mb-2">プレビュー</div>
                            <QRCodeSVG
                                value={generateQRData()}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                            <div className="small mt-2 text-muted">{studyRoom.name}</div>
                            <div className="small text-muted">
                                自習室ID: {studyRoom.studyRoomId}
                            </div>
                        </div>
                    </div>

                    {/* 印刷ボタン */}
                    <div className="d-grid gap-2">
                        <button className="btn btn-primary" onClick={handlePrintPDF}>
                            <i className="bi bi-printer me-2"></i>
                            {studyRoom.roomLimit}席分のQRコードをPDF出力
                        </button>
                        <div className="text-muted small text-center">
                            ※ {studyRoom.roomLimit}個のQRコードが座席番号付きで生成されます
                            <br />※ すべてのQRコードに自習室ID「{studyRoom.studyRoomId}
                            」が含まれます
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyRoomQRCode;
