import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 14, textAlign: "center", marginBottom: 15, fontWeight: "bold",},
  intro: { marginBottom: 15 },
  underline: { borderBottomWidth: 1, borderBottomColor: "#000", minWidth: 200, display: "flex" },
  list: { marginBottom: 15 },
  listItem: { flexDirection: "row", marginBottom: 6 },
  listNumber: { width: 20 },
  listText: { flex: 1 },
  boldText: { fontWeight: "bold" },
  footer: { marginTop: 30 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  sigContainer: { width: "45%", alignItems: "center", position: "relative" },
  signatureImage: { width: 100, height: 40, marginBottom: -15, zIndex: 10 },
  sigLine: { borderTopWidth: 1, borderTopColor: "#000", width: "100%", marginTop: 2, textAlign: "center", paddingTop: 2 },
  sigLabel: { fontSize: 8, textTransform: "uppercase" },
  renterName: { fontSize: 9, fontWeight: "bold", marginBottom: 2 }
});

interface RenterAgreementPDFProps {
  data: {
    full_name: string;
    e_signature: string;
  };
}

export const RenterAgreementPDF = ({ data }: RenterAgreementPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Renter Waiver and Agreement</Text>

      <View style={styles.intro}>
        <Text>
          I, <Text style={{ textDecoration: 'underline' }}>  {data.full_name}  </Text>, legal age, Agree as follows;
        </Text>
      </View>

      <View style={styles.list}>
        {[
          "The Renter is responsible for any damage that cause while he/she using the said vehicle that he/she rent.",
          "The Renter is responsible to pay the amount that he/she used while in using the said vehicle that he/she rent to the owner.",
          "The Renter is responsible to pay the daily rent of the vehicle, while being repaired, if ever being damage while he/she using it.",
          "The Owner is not responsible for any lost things inside the vehicle after being returned to the owner.",
          "The Owner has the right to file cases against the renter, if ever he/she did not pay the correspond amount that he she/used when he/she rent to the said vehicle.",
          "The Renter has full responsibilities if the said vehicle is being used in any illegal activities and the owner is not reliable for any illegal activities that being made by the renter, it is the responsibilities of the renter. (OWNER DO NOT TOLERATE ILLEGAL ACTIVITIES)",
          "The Owner is not responsible for any payments that the renter if being used in any illegal activities or any offenses punishable by the law that the renter did.",
          "The Renter is instructed to return the vehicle in good condition and the used of gasoline or diesel.",
          "The Renter is full responsibilities if the vehicle has lost or tow/towed by any government agencies.",
          "The Owner has the right to pull out his vehicle if the renter violate their contract or lease agreement or didn't pay the correspond daily, weekly or monthly rent of his/her vehicle."
        ].map((text, i) => (
          <View key={i} style={styles.listItem}>
            <Text style={styles.listNumber}>{i + 1}.</Text>
            <Text style={styles.listText}>{text}</Text>
          </View>
        ))}
      </View>

      <Text style={{ marginBottom: 20 }}>
        I am fully aware the full responsibilities of the agreement/waiver that being made between my owner/operator and I as a renter of his/her vehicle
      </Text>

      {/* FOOTER SIGNATURE GRID */}
      <View style={styles.footer}>
        <View style={styles.row}>
          <View style={styles.sigContainer}>
            {data.e_signature && <Image src={data.e_signature} style={styles.signatureImage} />}
            <Text style={styles.renterName}>{data.full_name.toUpperCase()}</Text>
            <View style={styles.sigLine}><Text style={styles.sigLabel}>Signature Over Printed NAME</Text></View>
          </View>
          <View style={styles.sigContainer}>
            <View style={{ height: 40 }} />
            <View style={styles.sigLine}><Text style={styles.sigLabel}>TYPE OF VEHICLE/PLATE#/COLOR</Text></View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.sigContainer}>
            <View style={styles.sigLine}><Text style={styles.sigLabel}>OWNER/OPERATOR/DISPATCHER</Text></View>
          </View>
          <View style={styles.sigContainer}>
            <View style={styles.sigLine}><Text style={styles.sigLabel}>DATE/TIME-DATE/TIME OF RETURN</Text></View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.sigContainer}>
            <View style={styles.sigLine}><Text style={styles.sigLabel}>WITNESS</Text></View>
          </View>
          <View style={styles.sigContainer}>
            <View style={styles.sigLine}><Text style={styles.sigLabel}>HOURS/DAILY/MONTHLY/RENT</Text></View>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);