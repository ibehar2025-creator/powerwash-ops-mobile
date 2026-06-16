import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { businessSettings, customers, expenses, invoices, jobs, servicePlans } from "./src/data/googleSheetData";
import { businessMetrics, currency, today } from "./src/lib/calculations";
import type { Job, ServicePlan } from "./src/types/business";

type Tab = "dashboard" | "calendar" | "jobs" | "plans" | "contracts";

const tabs: { id: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: "dashboard", label: "Dashboard", icon: "speedometer-outline" },
  { id: "calendar", label: "Calendar", icon: "calendar-outline" },
  { id: "jobs", label: "Jobs", icon: "list-outline" },
  { id: "plans", label: "Plans", icon: "repeat-outline" },
  { id: "contracts", label: "Contracts", icon: "document-text-outline" },
];

function addDays(date: string, days: number) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function customerName(customerId: string) {
  return customers.find((customer) => customer.id === customerId)?.name ?? "Unknown customer";
}

function planLabel(plan: ServicePlan) {
  return `${plan.type} plan`;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [calendarDate, setCalendarDate] = useState(today);
  const metrics = useMemo(() => businessMetrics(jobs, invoices, [], expenses, []), []);
  const jobsForDay = jobs.filter((job) => job.date === calendarDate);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.brand}>{businessSettings.businessName}</Text>
        <Text style={styles.title}>Ops Mobile</Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((item) => (
          <Pressable key={item.id} onPress={() => setTab(item.id)} style={[styles.tab, tab === item.id && styles.activeTab]}>
            <Ionicons name={item.icon} size={18} color={tab === item.id ? "#e9fbff" : "#45636c"} />
            <Text style={[styles.tabText, tab === item.id && styles.activeTabText]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {tab === "dashboard" && <Dashboard metrics={metrics} />}
        {tab === "calendar" && <Calendar date={calendarDate} jobsForDay={jobsForDay} onDateChange={setCalendarDate} />}
        {tab === "jobs" && <Jobs />}
        {tab === "plans" && <Plans />}
        {tab === "contracts" && <Contracts />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Dashboard({ metrics }: { metrics: ReturnType<typeof businessMetrics> }) {
  return (
    <View style={styles.stack}>
      <View style={styles.heroCard}>
        <Text style={styles.kicker}>Today</Text>
        <Text style={styles.heroValue}>{currency.format(metrics.dailyRevenue)}</Text>
        <Text style={styles.muted}>{metrics.jobsToday} jobs booked for today</Text>
      </View>
      <View style={styles.grid}>
        <Metric label="Month to date" value={currency.format(metrics.monthlyRevenue)} />
        <Metric label="Projected month" value={currency.format(metrics.projectedMonthlyRevenue)} />
        <Metric label="Expenses" value={currency.format(metrics.expenses)} />
        <Metric label="Net profit" value={currency.format(metrics.netProfit)} />
      </View>
      <Section title="Needs attention">
        <Row label="Past due jobs" value={String(metrics.pastDueJobs)} />
        <Row label="Unpaid invoices" value={String(metrics.unpaidInvoiceCount)} />
        <Row label="Upcoming jobs" value={String(metrics.upcomingJobs)} />
      </Section>
    </View>
  );
}

function Calendar({ date, jobsForDay, onDateChange }: { date: string; jobsForDay: Job[]; onDateChange: (date: string) => void }) {
  return (
    <View style={styles.stack}>
      <View style={styles.calendarHeader}>
        <Pressable style={styles.arrowButton} onPress={() => onDateChange(addDays(date, -1))}>
          <Ionicons name="chevron-back" size={24} color="#0f3d4a" />
        </Pressable>
        <View style={styles.datePill}>
          <Text style={styles.kicker}>Selected date</Text>
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Pressable style={styles.arrowButton} onPress={() => onDateChange(addDays(date, 1))}>
          <Ionicons name="chevron-forward" size={24} color="#0f3d4a" />
        </Pressable>
      </View>
      <Pressable style={styles.todayButton} onPress={() => onDateChange(today)}>
        <Text style={styles.todayText}>Jump to today</Text>
      </Pressable>
      <Section title={`${jobsForDay.length} jobs`}>
        {jobsForDay.length ? jobsForDay.map((job) => <JobCard key={job.id} job={job} />) : <Text style={styles.muted}>No jobs on this date.</Text>}
      </Section>
    </View>
  );
}

function Jobs() {
  return (
    <View style={styles.stack}>
      {jobs.slice(0, 30).map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </View>
  );
}

function Plans() {
  return (
    <View style={styles.stack}>
      {servicePlans.map((plan) => (
        <Section key={plan.id} title={customerName(plan.customerId)}>
          <Row label="Plan" value={planLabel(plan)} />
          <Row label="Renews" value={plan.renewalDate} />
          <Row label="Price" value={currency.format(plan.price)} />
          <Text style={styles.muted}>{plan.notes}</Text>
        </Section>
      ))}
    </View>
  );
}

function Contracts() {
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState("Every 6 weeks");
  const [services, setServices] = useState("Driveway, sidewalks, and patio");
  const [price, setPrice] = useState("$250");
  const draft = `Recurring Power Washing Service Agreement\n\nThis agreement is between ${businessSettings.businessName} and ${name.trim() || "[Customer Name]"}.\n\nServices: ${services.trim() || "[Services included]"}\n\nPrice: ${price.trim() || "[Price]"}\n\nFrequency: This recurring service plan is scheduled ${frequency.trim() || "[Plan frequency]"}.\n\nThe customer and The Powerwashing Pros will agree on the exact appointment time before each visit.`;

  return (
    <View style={styles.stack}>
      <Section title="Draft a contract">
        <Input label="Customer name" value={name} onChangeText={setName} placeholder="Customer name" />
        <Input label="Plan frequency" value={frequency} onChangeText={setFrequency} placeholder="Every 6 weeks" />
        <Input label="Included services" value={services} onChangeText={setServices} placeholder="Driveway, sidewalks, patio" multiline />
        <Input label="Amount they will pay" value={price} onChangeText={setPrice} placeholder="$250" />
      </Section>
      <Section title="Contract preview">
        <Text style={styles.contractText}>{draft}</Text>
      </Section>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobTop}>
        <Text style={styles.jobName}>{customerName(job.customerId)}</Text>
        <Text style={styles.badge}>{job.status}</Text>
      </View>
      <Text style={styles.muted}>{job.date} at {job.time}</Text>
      <Text style={styles.jobService}>{job.serviceType}</Text>
      <Row label="Address" value={job.address || "No address listed"} />
      <Row label="Price" value={currency.format(job.price)} />
    </View>
  );
}

function Input({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput {...props} style={[styles.input, props.multiline && styles.textarea]} placeholderTextColor="#81929a" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#eef6f8" },
  header: { backgroundColor: "#0f3d4a", paddingHorizontal: 18, paddingTop: 16, paddingBottom: 18 },
  brand: { color: "#9eeaf2", fontSize: 13, fontWeight: "700" },
  title: { color: "#ffffff", fontSize: 30, fontWeight: "800", marginTop: 2 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#ffffff" },
  tab: { flex: 1, alignItems: "center", gap: 4, borderRadius: 8, paddingVertical: 8 },
  activeTab: { backgroundColor: "#0f3d4a" },
  tabText: { color: "#45636c", fontSize: 11, fontWeight: "700" },
  activeTabText: { color: "#e9fbff" },
  content: { padding: 14, paddingBottom: 28 },
  stack: { gap: 14 },
  heroCard: { backgroundColor: "#0f3d4a", borderRadius: 8, padding: 18 },
  kicker: { color: "#5f7a82", fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  heroValue: { color: "#ffffff", fontSize: 42, fontWeight: "900", marginTop: 6 },
  muted: { color: "#60757d", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "48%", backgroundColor: "#ffffff", borderRadius: 8, padding: 14 },
  metricLabel: { color: "#60757d", fontSize: 12, fontWeight: "700" },
  metricValue: { color: "#0f3d4a", fontSize: 22, fontWeight: "900", marginTop: 6 },
  card: { backgroundColor: "#ffffff", borderRadius: 8, padding: 14 },
  sectionTitle: { color: "#0f3d4a", fontSize: 18, fontWeight: "900" },
  sectionBody: { marginTop: 10, gap: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  rowLabel: { color: "#60757d", flex: 1 },
  rowValue: { color: "#18343d", flex: 1, fontWeight: "800", textAlign: "right" },
  calendarHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  arrowButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  datePill: { flex: 1, backgroundColor: "#ffffff", borderRadius: 8, padding: 12, alignItems: "center" },
  dateText: { color: "#0f3d4a", fontSize: 22, fontWeight: "900" },
  todayButton: { backgroundColor: "#10b7c7", borderRadius: 8, padding: 12, alignItems: "center" },
  todayText: { color: "#07313b", fontWeight: "900" },
  jobCard: { backgroundColor: "#ffffff", borderRadius: 8, padding: 14, gap: 8 },
  jobTop: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  jobName: { color: "#0f3d4a", fontSize: 17, fontWeight: "900", flex: 1 },
  badge: { overflow: "hidden", borderRadius: 999, backgroundColor: "#e9fbff", color: "#087987", paddingHorizontal: 10, paddingVertical: 3, fontSize: 12, fontWeight: "800" },
  jobService: { color: "#18343d", fontWeight: "700" },
  inputWrap: { gap: 6 },
  inputLabel: { color: "#415a62", fontWeight: "800" },
  input: { borderWidth: 1, borderColor: "#d6e5e9", borderRadius: 8, padding: 12, color: "#18343d", backgroundColor: "#f8fbfc" },
  textarea: { minHeight: 86, textAlignVertical: "top" },
  contractText: { color: "#18343d", lineHeight: 22, fontFamily: "Courier" },
});
