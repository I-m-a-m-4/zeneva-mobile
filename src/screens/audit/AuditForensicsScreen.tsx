import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useMobilePos } from '@/context/MobilePosContext';
import { useAuth } from '@/context/AuthContext';
import {
  runForensicScan,
  type ForensicReport,
  type Finding,
  type Severity,
} from '@/lib/forensics';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  User,
  Clock,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

export function AuditForensicsScreen() {
  const { receipts, products } = useMobilePos();
  const { business } = useAuth();

  const [report, setReport] = useState<ForensicReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null);

  const currency = business?.settings?.currency || 'NGN';

  const handleRunScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      try {
        const result = runForensicScan({
          receipts: receipts || [],
          auditLogs: [],
          products: products || [],
          users: [],
          customers: [],
          currency,
          now: Date.now(),
        });
        setReport(result);
      } catch (err: any) {
        Alert.alert('Scan Failed', err?.message || 'Forensic analysis could not be completed.');
      } finally {
        setIsScanning(false);
      }
    }, 400);
  };

  const getSeverityStyle = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return { badge: styles.badgeCritical, text: styles.textCritical };
      case 'high':
        return { badge: styles.badgeHigh, text: styles.textHigh };
      case 'medium':
        return { badge: styles.badgeMedium, text: styles.textMedium };
      default:
        return { badge: styles.badgeLow, text: styles.textLow };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerCard}>
          <View style={styles.headerIcon}>
            <ShieldAlert size={28} color="#F47125" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Loss Prevention & Audit</Text>
            <Text style={styles.headerSubtitle}>
              Pure arithmetic peer-median cashier fraud & anomaly detection
            </Text>
          </View>
        </View>

        {/* Scan Trigger Callout */}
        <View style={styles.triggerCard}>
          <View style={styles.triggerTextCol}>
            <Text style={styles.triggerTitle}>Automated Integrity Scan</Text>
            <Text style={styles.triggerDesc}>
              Scans all recent transaction voids, abnormal discounts, and cashier peer variance.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scanBtn, isScanning && { opacity: 0.7 }]}
            onPress={handleRunScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Play size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.scanBtnText}>Run Scan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Report Overview if scan was run */}
        {report ? (
          <View style={styles.reportContainer}>
            {/* Top Score Banner */}
            <View
              style={[
                styles.reportBanner,
                report.findings.length > 0 ? styles.reportBannerAlert : styles.reportBannerClean,
              ]}
            >
              {report.findings.length > 0 ? (
                <AlertTriangle size={32} color="#DC2626" />
              ) : (
                <ShieldCheck size={32} color="#10B981" />
              )}
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={styles.bannerTitle}>
                  {report.findings.length > 0
                    ? `${report.findings.length} Suspicious Patterns Flagged`
                    : 'Clean Bill of Health'}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {report.findings.length > 0
                    ? `Estimated exposure: ${currency} ${(report.exposure || 0).toLocaleString()}`
                    : 'No cashier peer discrepancies or void abuse detected in this period.'}
                </Text>
              </View>
            </View>

            {/* Findings List */}
            {report.findings.length > 0 ? (
              <View style={styles.findingsSection}>
                <Text style={styles.sectionTitle}>Investigative Findings</Text>
                {report.findings.map((f, idx) => {
                  const sStyle = getSeverityStyle(f.severity);
                  const isExpanded = expandedFinding === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id || idx}
                      style={styles.findingCard}
                      onPress={() => setExpandedFinding(isExpanded ? null : f.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.findingHeader}>
                        <View style={[styles.severityBadge, sStyle.badge]}>
                          <Text style={[styles.severityText, sStyle.text]}>
                            {f.severity.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.findingExposure}>
                          {currency} {f.exposure?.toLocaleString() || '0'}
                        </Text>
                      </View>

                      <Text style={styles.findingTitle}>{f.title}</Text>
                      <Text style={styles.findingSummary}>{f.what}</Text>

                      {isExpanded ? (
                        <View style={styles.expandedContent}>
                          <View style={styles.divider} />
                          <Text style={styles.detailLabel}>Cashier / Subject:</Text>
                          <Text style={styles.detailVal}>
                            {f.suspects && f.suspects.length > 0
                              ? f.suspects.map((s) => s.name).join(', ')
                              : 'All Cashiers'}
                          </Text>

                          <Text style={styles.detailLabel}>Analysis & Mechanism:</Text>
                          <Text style={styles.detailVal}>{f.why}</Text>

                          {f.action ? (
                            <>
                              <Text style={styles.detailLabel}>Recommended Action:</Text>
                              <Text style={styles.detailVal}>{f.action}</Text>
                            </>
                          ) : null}
                        </View>
                      ) : null}

                      <View style={styles.cardToggleRow}>
                        <Text style={styles.toggleText}>
                          {isExpanded ? 'Hide Details' : 'View Breakdown & Evidence'}
                        </Text>
                        {isExpanded ? (
                          <ChevronUp size={16} color="#64748B" />
                        ) : (
                          <ChevronDown size={16} color="#64748B" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Recent Transaction Log */}
        <Text style={styles.sectionTitle}>Recent POS Audit Stream</Text>
        {receipts.length === 0 ? (
          <View style={styles.emptyCard}>
            <FileText size={32} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No transaction audit records</Text>
            <Text style={styles.emptySubtitle}>Sales completed in POS will be logged here for forensics.</Text>
          </View>
        ) : (
          receipts.slice(0, 15).map((r) => (
            <View key={r.id} style={styles.auditRow}>
              <View style={styles.auditLeft}>
                <Text style={styles.auditAction}>Sale #{r.id}</Text>
                <Text style={styles.auditMeta}>
                  Cashier: {r.cashierName} • {new Date(r.createdAt as any).toLocaleTimeString()}
                </Text>
              </View>
              <Text style={styles.auditAmount}>
                {currency} {r.total.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  triggerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  triggerTextCol: {
    flex: 1,
    marginRight: 12,
  },
  triggerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  triggerDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    lineHeight: 16,
  },
  scanBtn: {
    backgroundColor: '#F47125',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reportContainer: {
    marginBottom: 16,
  },
  reportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  reportBannerClean: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  reportBannerAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  findingsSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  findingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeCritical: { backgroundColor: '#FEF2F2' },
  textCritical: { color: '#DC2626', fontWeight: '800' },
  badgeHigh: { backgroundColor: '#FFF7ED' },
  textHigh: { color: '#EA580C', fontWeight: '800' },
  badgeMedium: { backgroundColor: '#FFFBEB' },
  textMedium: { color: '#D97706', fontWeight: '800' },
  badgeLow: { backgroundColor: '#F1F5F9' },
  textLow: { color: '#64748B', fontWeight: '800' },
  severityText: {
    fontSize: 11,
  },
  findingExposure: {
    fontSize: 14,
    fontWeight: '800',
    color: '#DC2626',
  },
  findingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  findingSummary: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  cardToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F47125',
  },
  expandedContent: {
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 6,
  },
  detailVal: {
    fontSize: 13,
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 18,
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  auditLeft: {
    flex: 1,
  },
  auditAction: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  auditMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  auditAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
