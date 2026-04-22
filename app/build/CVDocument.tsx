import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

type Experience = {
  title: string;
  company: string;
  period: string;
  bullets: string[];
};

type CV = {
  summary: string;
  skills: string[];
  experience: Experience[];
};

type Props = {
  name: string;
  jobTitle: string;
  cv: CV;
};

const AMBER = "#b45309";
const DARK = "#111827";
const MUTED = "#6b7280";
const TEXT = "#374151";
const BORDER = "#e5e7eb";
const LIGHT = "#f9fafb";
const ACCENT = "#d97706";
const SKILL_BG = "#fef3c7";
const SKILL_BORDER = "#fde68a";
const SKILL_TEXT = "#78350f";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingTop: 44,
    paddingBottom: 44,
    paddingLeft: 52,
    paddingRight: 52,
    color: TEXT,
    backgroundColor: "#ffffff",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: ACCENT,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  name: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  jobTitle: {
    fontSize: 12,
    color: AMBER,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  summaryText: {
    fontSize: 10.5,
    lineHeight: 1.65,
    color: TEXT,
  },
  expBlock: {
    marginBottom: 14,
  },
  expRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  expTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    flex: 1,
    lineHeight: 1.3,
  },
  expPeriod: {
    fontSize: 9,
    color: MUTED,
    marginLeft: 10,
    lineHeight: 1.3,
  },
  expCompany: {
    fontSize: 9.5,
    color: MUTED,
    marginBottom: 5,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletDot: {
    width: 14,
    fontSize: 9,
    color: AMBER,
    marginTop: 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.55,
    color: TEXT,
  },
  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 2,
  },
  skillPill: {
    backgroundColor: SKILL_BG,
    borderWidth: 1,
    borderColor: SKILL_BORDER,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 4,
    fontSize: 9,
    color: SKILL_TEXT,
    fontFamily: "Helvetica-Bold",
  },
});

export default function CVDocument({ name, jobTitle, cv }: Props) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Full-width accent bar at top — sits above page padding */}
        <View style={s.accentBar} fixed />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.name}>{name}</Text>
          <Text style={s.jobTitle}>{jobTitle}</Text>
        </View>

        {/* Profile */}
        {cv.summary ? (
          <View>
            <Text style={s.sectionLabel}>Profile</Text>
            <Text style={s.summaryText}>{cv.summary}</Text>
          </View>
        ) : null}

        {/* Experience */}
        {cv.experience && cv.experience.length > 0 ? (
          <View>
            <Text style={s.sectionLabel}>Experience</Text>
            {cv.experience.map((exp, i) => (
              <View key={i} style={s.expBlock}>
                <View style={s.expRow}>
                  <Text style={s.expTitle}>{exp.title}</Text>
                  <Text style={s.expPeriod}>{exp.period}</Text>
                </View>
                <Text style={s.expCompany}>{exp.company}</Text>
                {exp.bullets.map((b, j) => (
                  <View key={j} style={s.bulletRow}>
                    <Text style={s.bulletDot}>›</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Skills */}
        {cv.skills && cv.skills.length > 0 ? (
          <View>
            <Text style={s.sectionLabel}>Skills</Text>
            <View style={s.skillsWrap}>
              {cv.skills.map((skill, i) => (
                <Text key={i} style={s.skillPill}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
