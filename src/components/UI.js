import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, ScrollView,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../constants/theme';

// ── Card ──────────────────────────────────────────────────────────────────
export function Card({ children, style, onPress }) {
  const { C } = useTheme();
  const content = (
    <View style={[{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: C.border }, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity activeOpacity={0.75} onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

// ── Button ────────────────────────────────────────────────────────────────
export function Button({ label, onPress, variant = 'primary', disabled, style, icon }) {
  const { C } = useTheme();
  const bg = variant === 'primary'   ? C.accent
           : variant === 'danger'    ? C.danger
           : variant === 'ghost'     ? 'transparent'
           : C.bgInput;
  const color = variant === 'ghost' ? C.accent : '#fff';
  const border = variant === 'ghost' ? { borderWidth: 1.5, borderColor: C.accent } : {};
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled}
      style={[{
        backgroundColor: bg, borderRadius: RADIUS.xl,
        height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        opacity: disabled ? 0.35 : 1, gap: 8,
      }, border, style]}
    >
      {icon && <Text style={{ fontSize: 18 }}>{icon}</Text>}
      <Text style={{ color, fontSize: 17, fontWeight: '700', letterSpacing: 0.2 }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────
export function Input({ label, value, onChangeText, placeholder, keyboardType, style, multiline, inputRef }) {
  const { C } = useTheme();
  return (
    <View style={[{ marginBottom: SPACING.md }, style]}>
      {label && <Text style={{ color: C.textSub, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        keyboardType={keyboardType}
        multiline={multiline}
        style={{
          backgroundColor: C.bgInput, borderRadius: RADIUS.md,
          borderWidth: 1.5, borderColor: C.border,
          color: C.text, fontSize: 17, padding: SPACING.lg,
          minHeight: multiline ? 80 : undefined,
        }}
      />
    </View>
  );
}

// ── Section title ─────────────────────────────────────────────────────────
export function SectionTitle({ label, action, onAction }) {
  const { C } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: SPACING.sm, paddingTop: SPACING.lg }}>
      <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.3 }}>{label}</Text>
      {action && <TouchableOpacity onPress={onAction}><Text style={{ color: C.accent, fontSize: 14, fontWeight: '600' }}>{action}</Text></TouchableOpacity>}
    </View>
  );
}

// ── Pill / chip ───────────────────────────────────────────────────────────
export function Pill({ label, active, onPress, color }) {
  const { C } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: active ? (color || C.accent) : C.bgInput,
        borderWidth: 1.5,
        borderColor: active ? (color || C.accent) : C.border,
        alignSelf: 'flex-start',
      }}
    >
      <Text numberOfLines={1} style={{ color: active ? '#fff' : C.textSub, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Loading spinner ───────────────────────────────────────────────────────
export function Loader({ size = 'large' }) {
  const { C } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size={size} color={C.accent} />
    </View>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }) {
  const { C } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: SPACING.xxxl }}>
      <Text style={{ fontSize: 48, marginBottom: SPACING.lg }}>{icon}</Text>
      <Text style={{ color: C.text, fontSize: 17, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' }}>{title}</Text>
      {subtitle && <Text style={{ color: C.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>{subtitle}</Text>}
    </View>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────
export function ProgressBar({ value, max, color, height = 6 }) {
  const { C } = useTheme();
  const pct = Math.min((value / max) * 100, 100);
  const barColor = pct >= 100 ? C.danger : pct >= 80 ? C.warning : color;
  return (
    <View style={{ height, backgroundColor: C.border, borderRadius: height, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: barColor, borderRadius: height }} />
    </View>
  );
}

// ── Category icon ─────────────────────────────────────────────────────────
export function CategoryIcon({ emoji, color, size = 44 }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size * 0.32,
      backgroundColor: color + '22',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.45 }}>{emoji}</Text>
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────
export function Divider() {
  const { C } = useTheme();
  return <View style={{ height: 1, backgroundColor: C.border, marginVertical: SPACING.xs }} />;
}
