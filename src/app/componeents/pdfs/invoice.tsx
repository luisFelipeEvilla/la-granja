"use client";
import { PDFViewer, Document, Page, Text} from "@react-pdf/renderer"

export default function PDFView({...props}) {
    return (
        <PDFViewer style={{ height: '100%', width: '100%'}}>
            <Document>
                <Page>
                    <Text>Hola</Text>
                </Page>
            </Document>
        </PDFViewer>
    )
}