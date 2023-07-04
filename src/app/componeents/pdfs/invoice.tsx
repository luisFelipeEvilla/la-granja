"use client";
import { ProviderWithProducts } from "@/types/Provider";
import { PDFViewer, Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"

type Props = { provider: ProviderWithProducts, price: number }

Font.register({
    family: 'Oswald',
    src: 'https://fonts.gstatic.com/s/oswald/v13/Y_TKV6o8WovbUd3m_X9aAA.ttf'
});

const styles = StyleSheet.create({
    body: { paddingHorizontal: 20, paddingVertical: 20 },
    logo: { width: 120, height: 60 },
    header: { display: 'flex', flexDirection: 'row', justifyContent: "space-between",  alignItems: 'center', marginBottom: 20 },
    title: { fontSize: 24, textAlign: 'center', marginRight: 50 },
    date: { fontSize: 12, textAlign: 'right', marginRight: 20 },
    fieldLabel: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
    fieldValue: { fontSize: 12, marginBottom: 10 },
    divider: { border: '1px solid gray', marginBottom: 10 },
    table: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        borderStyle: "solid",
    },
    tableRow: {
        width: '100%',
        display: "flex",
        flexDirection: "row",
        borderStyle: "solid",
        borderWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomWidth: 0
    },
    tableCol: {
        fontSize: 13,
        // fontFamily: 'Oswald',
        fontWeight: 700,
        verticalAlign: 'sub',
        borderTopWidth: 1,
    },
    tableCell: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        fontSize: 9,
        fontWeight: 'normal',
        flex: 1,
        textAlign: 'center',
        borderStyle: "solid",
        borderBottomWidth: 1,
        borderRightWidth: 1,
    }
});

export default function PDFView(props: Props) {
    const getPrice = (amount: number) => {
        // return price format with millar separator
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    }

    const getTotalPrice = () => {
        let total = 0;
        props.provider.products.forEach(product => {
            total += props.price * product.quantity;
        });

        return getPrice(total);
    }

    const getTotal = () => {
        let total = 0;
        props.provider.products.forEach(product => {
            total += product.quantity;
        });

        return total;
    }

    const getIdNumber = (idNum: number) => {
        //return with millar point separator
        return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(idNum);
    }

    const getDate = (dateString: Date) => {
        const date = new Date(dateString);
        return `${date.toISOString().split('T')[0].split('-').reverse().join('/')}`
    }

    return (
        <PDFViewer style={{ height: '100%', width: '100%' }}>
            <Document title={`Liquidación ${props.provider.firstName} ${props.provider.lastName}`}>
                <Page style={styles.body}>
                    <View style={styles.header}>
                        <Image style={styles.logo} src={'/images/logo.jpg'}/>
                        <Text style={styles.title}> Lácteos La Granja </Text>
                        <View style={styles.date}>
                            <Text>{new Date().toLocaleDateString()}</Text>
                        </View>
                    </View>

                    <View style={styles.divider}></View>

                    <View style={{display: 'flex', flexDirection: 'row'}}>
                        <View>
                            <View>
                                <Text style={styles.fieldLabel}>Nombre</Text>
                                <Text style={styles.fieldValue}>{props.provider.firstName} {props.provider.lastName}</Text>
                            </View>

                            <View>
                                <Text style={styles.fieldLabel}>Número de Identificación</Text>
                                <Text style={styles.fieldValue}>{getIdNumber(props.provider.idNum)}</Text>
                            </View>
                        </View>


                        <View style={{ marginLeft: 70}}>
                            <View>
                                <Text style={styles.fieldLabel}>Número Telefónico</Text>
                                <Text style={styles.fieldValue}>(+57) {props.provider.phone}</Text>
                            </View>

                            <View>
                                <Text style={styles.fieldLabel}>Correo Electrónico</Text>
                                <Text style={styles.fieldValue}>{props.provider.email}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.table}>
                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell, ...styles.tableCol }}>Producto</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableCol }}>Fecha de Ingreso</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableCol }}>Cantidad</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableCol }}>Precio</Text>
                            <Text style={{ ...styles.tableCell, ...styles.tableCol }}>Total</Text>
                        </View>

                        {
                            props.provider.products.map((product, index) => (
                                <View style={styles.tableRow} key={index}>
                                    <Text style={styles.tableCell}>Leche entera(Lts)</Text>
                                    <Text style={styles.tableCell}>{ getDate(product.createdAt)}</Text>
                                    <Text style={styles.tableCell}>{product.quantity}</Text>
                                    <Text style={styles.tableCell}>{ getPrice(props.price) }</Text>
                                    <Text style={styles.tableCell}>{ getPrice(product.quantity * props.price)}</Text>
                                </View>
                            ))
                        }

                        <View style={styles.tableRow}>
                            <Text style={{ ...styles.tableCell }}>Total</Text>
                            <Text style={{ ...styles.tableCell }}></Text>
                            <Text style={{ ...styles.tableCell }}>{ getTotal() }</Text>
                            <Text style={{ ...styles.tableCell }}></Text>
                            <Text style={{ ...styles.tableCell }}>{getTotalPrice()}</Text>
                        </View>
                    </View>


                </Page>
            </Document>
        </PDFViewer>
    )
}