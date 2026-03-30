import React, { useMemo, useState } from "react";
import { TOKENS } from "../theme/tokens";
import { formatDateTime, summarizeValue, truncate } from "../utils/format";

export interface Viewport {
  width: number;
  height: number;
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buttonColors(variant: ButtonVariant, active: boolean, disabled: boolean) {
  if (disabled) {
    return { background: TOKENS.panelInset, foreground: TOKENS.textWeak, border: TOKENS.border };
  }
  if (variant === "primary") {
    return {
      background: active ? TOKENS.accentStrong : TOKENS.accent,
      foreground: "#FFFFFF",
      border: TOKENS.accentStrong,
    };
  }
  if (variant === "danger") {
    return {
      background: active ? TOKENS.dangerMuted : "transparent",
      foreground: TOKENS.danger,
      border: TOKENS.dangerMuted,
    };
  }
  if (variant === "ghost") {
    return {
      background: active ? TOKENS.rowHover : "transparent",
      foreground: TOKENS.textMuted,
      border: active ? TOKENS.borderStrong : "transparent",
    };
  }
  return {
    background: active ? TOKENS.rowHover : TOKENS.panel,
    foreground: TOKENS.text,
    border: TOKENS.borderStrong,
  };
}

/* ─── Table cell primitive ─────────────────────────────────────────────── */

function TableCell(props: {
  children: React.ReactNode;
  width?: number;
  minWidth?: number;
  flexGrow?: number;
  align?: "left" | "right";
  tone?: "default" | "muted" | "subtle";
  separator?: boolean;
}) {
  const foreground =
    props.tone === "muted"
      ? TOKENS.textMuted
      : props.tone === "subtle"
        ? TOKENS.textSubtle
        : TOKENS.text;

  return (
    <box
      style={{
        width: props.width,
        minWidth: props.minWidth ?? props.width,
        flexGrow: props.flexGrow ?? 0,
        flexShrink: props.flexGrow ? 1 : 0,
        paddingRight: 2,
        overflow: "hidden",
        justifyContent: props.align === "right" ? "flex-end" : "flex-start",
      }}
    >
      {props.separator ? (
        <text content="│ " style={{ fg: TOKENS.border }} />
      ) : null}
      <text content={String(props.children)} style={{ fg: foreground }} />
    </box>
  );
}

/* ─── Logo ─────────────────────────────────────────────────────────────── */

export function AppLogo(props: { compact?: boolean }) {
  return (
    <box style={{ flexDirection: "row", alignItems: "center" }}>
      <text content="◢" style={{ fg: TOKENS.accent, marginRight: 1 }} />
      <text
        content={props.compact ? "APPWRITE" : "APPWRITE CONSOLE"}
        style={{ fg: TOKENS.text }}
      />
    </box>
  );
}

/* ─── Badge ────────────────────────────────────────────────────────────── */

export function Badge(props: {
  label: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
}) {
  const style = useMemo(() => {
    switch (props.tone) {
      case "accent":
        return { background: TOKENS.accentMuted, foreground: TOKENS.accent };
      case "success":
        return { background: TOKENS.successMuted, foreground: TOKENS.success };
      case "warning":
        return { background: TOKENS.warningMuted, foreground: TOKENS.warning };
      case "danger":
        return { background: TOKENS.dangerMuted, foreground: TOKENS.danger };
      default:
        return { background: TOKENS.badge, foreground: TOKENS.textMuted };
    }
  }, [props.tone]);

  return (
    <box
      style={{
        backgroundColor: style.background,
        paddingLeft: 1,
        paddingRight: 1,
        height: 1,
        justifyContent: "center",
      }}
    >
      <text content={props.label} style={{ fg: style.foreground }} />
    </box>
  );
}

/* ─── Button ───────────────────────────────────────────────────────────── */

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  width?: number;
  compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const tone = buttonColors(props.variant ?? "secondary", hovered, Boolean(props.disabled));

  if (props.compact) {
    return (
      <box
        onMouseOver={() => setHovered(true)}
        onMouseOut={() => setHovered(false)}
        onMouseDown={(event) => {
          if (props.disabled) return;
          event.preventDefault();
          props.onPress();
        }}
        style={{
          backgroundColor: tone.background,
          paddingLeft: 1,
          paddingRight: 1,
          height: 1,
          justifyContent: "center",
          width: props.width,
        }}
      >
        <text content={props.label} style={{ fg: tone.foreground }} />
      </box>
    );
  }

  return (
    <box
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseDown={(event) => {
        if (props.disabled) return;
        event.preventDefault();
        props.onPress();
      }}
      style={{
        backgroundColor: tone.background,
        border: true,
        borderColor: tone.border,
        paddingLeft: 1,
        paddingRight: 1,
        height: 3,
        justifyContent: "center",
        width: props.width,
      }}
    >
      <text content={props.label} style={{ fg: tone.foreground }} />
    </box>
  );
}

export function IconButton(props: {
  icon: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      label={`${props.icon} ${props.label}`}
      onPress={props.onPress}
      variant="ghost"
      disabled={props.disabled}
      compact
    />
  );
}

/* ─── Alert banner ─────────────────────────────────────────────────────── */

export function AlertBanner(props: { tone: "success" | "warning" | "danger"; message: string }) {
  const tone =
    props.tone === "success"
      ? { bg: TOKENS.successMuted, fg: TOKENS.success, icon: "✓" }
      : props.tone === "warning"
        ? { bg: TOKENS.warningMuted, fg: TOKENS.warning, icon: "!" }
        : { bg: TOKENS.dangerMuted, fg: TOKENS.danger, icon: "✗" };

  return (
    <box
      style={{
        backgroundColor: tone.bg,
        paddingLeft: 1,
        paddingRight: 1,
        height: 1,
        marginBottom: 1,
      }}
    >
      <text content={`${tone.icon} ${props.message}`} style={{ fg: tone.fg }} />
    </box>
  );
}

/* ─── Card ─────────────────────────────────────────────────────────────── */

export function Card(props: {
  title?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  padding?: number;
  tone?: "panel" | "shell";
}) {
  const padding = props.padding ?? 1;
  const backgroundColor = props.tone === "shell" ? TOKENS.shell : TOKENS.panelAlt;

  return (
    <box
      style={{
        flexDirection: "column",
        backgroundColor,
        border: true,
        borderColor: TOKENS.border,
        minHeight: 0,
        flexGrow: 1,
      }}
    >
      {props.title || props.actions ? (
        <box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: padding,
            paddingRight: padding,
            height: 1,
            backgroundColor: TOKENS.panelAlt,
            border: ["bottom"],
            borderColor: TOKENS.border,
          }}
        >
          <text content={props.title ?? ""} style={{ fg: TOKENS.textMuted }} />
          {props.actions ? <box style={{ flexShrink: 0 }}>{props.actions}</box> : null}
        </box>
      ) : null}
      <box
        style={{
          flexDirection: "column",
          paddingLeft: padding,
          paddingRight: padding,
          paddingTop: 1,
          paddingBottom: 1,
          flexGrow: 1,
          minHeight: 0,
        }}
      >
        {props.children}
      </box>
      {props.footer ? (
        <box
          style={{
            border: ["top"],
            borderColor: TOKENS.border,
            paddingLeft: padding,
            paddingRight: padding,
            height: 1,
          }}
        >
          {props.footer}
        </box>
      ) : null}
    </box>
  );
}

/* ─── Page header ──────────────────────────────────────────────────────── */

export function PageHeader(props: {
  title: string;
  description: string;
  actions?: React.ReactNode;
  breadcrumbs?: string[];
  meta?: React.ReactNode;
}) {
  return (
    <box style={{ flexDirection: "column", marginBottom: 1 }}>
      {props.breadcrumbs && props.breadcrumbs.length > 0 ? (
        <box style={{ flexDirection: "row", height: 1 }}>
          <text content={props.breadcrumbs.join(" / ")} style={{ fg: TOKENS.textSubtle }} />
        </box>
      ) : null}
      <box
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          height: 1,
        }}
      >
        <box style={{ flexDirection: "row", alignItems: "center" }}>
          <text content={props.title} style={{ fg: TOKENS.text }} />
          {props.meta ? <box style={{ marginLeft: 1 }}>{props.meta}</box> : null}
        </box>
        {props.actions ? <box>{props.actions}</box> : null}
      </box>
    </box>
  );
}

/* ─── Tabs ─────────────────────────────────────────────────────────────── */

function TabItem(props: {
  tab: {
    id: string;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onPress?: () => void;
  };
}) {
  const [hovered, setHovered] = useState(false);
  const tab = props.tab;

  return (
    <box
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseDown={(event) => {
        if (tab.disabled) return;
        event.preventDefault();
        tab.onPress?.();
      }}
      style={{
        paddingLeft: 1,
        paddingRight: 1,
        backgroundColor:
          tab.active
            ? TOKENS.shellRaised
            : hovered && !tab.disabled
              ? TOKENS.rowHover
              : "transparent",
      }}
    >
      <text
        content={tab.label}
        style={{
          fg: tab.disabled
            ? TOKENS.textWeak
            : tab.active
              ? TOKENS.text
              : TOKENS.textMuted,
        }}
      />
    </box>
  );
}

export function Tabs(props: {
  tabs: Array<{
    id: string;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onPress?: () => void;
  }>;
}) {
  return (
    <box
      style={{
        flexDirection: "row",
        border: ["bottom"],
        borderColor: TOKENS.border,
        marginBottom: 1,
      }}
    >
      {props.tabs.map((tab) => (
        <TabItem key={tab.id} tab={tab} />
      ))}
    </box>
  );
}

/* ─── Sidebar item ─────────────────────────────────────────────────────── */

export function SidebarItem(props: {
  label: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  secondary?: string;
  onPress?: () => void;
  iconOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const interactive = !props.disabled && Boolean(props.onPress);
  const isActive = props.active || (interactive && hovered);

  const iconColor = props.disabled
    ? TOKENS.textWeak
    : props.active
      ? TOKENS.accent
      : TOKENS.textSubtle;
  const textColor = props.disabled
    ? TOKENS.textWeak
    : props.active
      ? TOKENS.text
      : TOKENS.textMuted;
  const bgColor = props.active
    ? TOKENS.shellRaised
    : isActive
      ? TOKENS.rowHover
      : "transparent";

  return (
    <box
      onMouseOver={() => setHovered(true)}
      onMouseOut={() => setHovered(false)}
      onMouseDown={(event) => {
        if (!interactive) return;
        event.preventDefault();
        props.onPress?.();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: bgColor,
        paddingLeft: 1,
        paddingRight: 1,
        height: 1,
      }}
    >
      <text content={props.icon} style={{ fg: iconColor, marginRight: props.iconOnly ? 0 : 1 }} />
      {!props.iconOnly ? (
        <text content={props.label} style={{ fg: textColor }} />
      ) : null}
    </box>
  );
}

/* ─── Input fields ─────────────────────────────────────────────────────── */

function InputFrame(props: {
  label?: string;
  helper?: string;
  leading?: React.ReactNode;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <box style={{ flexDirection: "column", marginBottom: 1 }}>
      {props.label ? (
        <text
          content={props.label.toUpperCase()}
          style={{ fg: TOKENS.textSubtle, marginBottom: 1 }}
        />
      ) : null}
      <box
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: TOKENS.input,
          border: true,
          borderColor: TOKENS.border,
          paddingLeft: 1,
          paddingRight: 1,
          height: 3,
          width: "100%",
        }}
      >
        {props.leading ? (
          <box style={{ marginRight: 1, flexShrink: 0 }}>{props.leading}</box>
        ) : null}
        <box
          style={{
            flexGrow: 1,
            flexShrink: 1,
            minWidth: 0,
            height: 1,
            justifyContent: "center",
          }}
        >
          <input
            value={props.value}
            onInput={props.onChange}
            onKeyDown={(key) => {
              if (
                key.name === "return" ||
                key.name === "enter" ||
                key.name === "kpenter" ||
                key.name === "linefeed"
              ) {
                key.preventDefault();
                props.onSubmit?.();
              }
            }}
            placeholder={props.placeholder}
            cursorColor={TOKENS.accent}
            width="100%"
            style={{
              width: "100%",
              flexGrow: 1,
              flexShrink: 1,
              minWidth: 0,
              backgroundColor: TOKENS.input,
              focusedBackgroundColor: TOKENS.input,
              textColor: TOKENS.text,
              focusedTextColor: TOKENS.text,
              placeholderColor: TOKENS.textSubtle,
            }}
          />
        </box>
      </box>
      {props.helper ? (
        <text content={props.helper} style={{ fg: TOKENS.textSubtle }} />
      ) : null}
    </box>
  );
}

export function Field(props: {
  label: string;
  value: string;
  placeholder?: string;
  helper?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return <InputFrame {...props} />;
}

export function SearchField(props: {
  label?: string;
  value: string;
  placeholder?: string;
  helper?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) {
  return (
    <InputFrame
      label={props.label}
      value={props.value}
      placeholder={props.placeholder}
      helper={props.helper}
      onChange={props.onChange}
      onSubmit={props.onSubmit}
      leading={<text content="⌕" style={{ fg: TOKENS.textSubtle }} />}
    />
  );
}

/* ─── Inline search (compact, for toolbars) ────────────────────────────── */

export function InlineSearch(props: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  width?: number;
}) {
  return (
    <box
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: TOKENS.input,
        border: true,
        borderColor: TOKENS.border,
        paddingLeft: 1,
        paddingRight: 1,
        height: 3,
        width: props.width,
        flexGrow: props.width ? 0 : 1,
        flexShrink: 1,
        minWidth: 0,
      }}
    >
      <text content="⌕" style={{ fg: TOKENS.textSubtle, marginRight: 1 }} />
      <input
        value={props.value}
        onInput={props.onChange}
        onKeyDown={(key) => {
          if (
            key.name === "return" ||
            key.name === "enter" ||
            key.name === "kpenter" ||
            key.name === "linefeed"
          ) {
            key.preventDefault();
            props.onSubmit?.();
          }
        }}
        placeholder={props.placeholder}
        cursorColor={TOKENS.accent}
        width="100%"
        style={{
          width: "100%",
          flexGrow: 1,
          flexShrink: 1,
          minWidth: 0,
          backgroundColor: TOKENS.input,
          focusedBackgroundColor: TOKENS.input,
          textColor: TOKENS.text,
          focusedTextColor: TOKENS.text,
          placeholderColor: TOKENS.textSubtle,
        }}
      />
    </box>
  );
}

/* ─── Toggle row ───────────────────────────────────────────────────────── */

export function ToggleRow(props: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <box
      onMouseDown={(event) => {
        event.preventDefault();
        props.onToggle();
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: TOKENS.panel,
        border: true,
        borderColor: TOKENS.border,
        paddingLeft: 1,
        paddingRight: 1,
        paddingTop: 1,
        paddingBottom: 1,
        marginBottom: 1,
      }}
    >
      <box
        style={{
          flexDirection: "column",
          flexGrow: 1,
          flexShrink: 1,
          paddingRight: 1,
        }}
      >
        <text content={props.label} style={{ fg: TOKENS.text }} />
        <text content={props.description} style={{ fg: TOKENS.textMuted }} />
      </box>
      <Badge label={props.enabled ? "On" : "Off"} tone={props.enabled ? "accent" : "default"} />
    </box>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────── */

export function EmptyState(props: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <box
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: TOKENS.panelAlt,
        paddingLeft: 2,
        paddingRight: 2,
        paddingTop: 1,
        paddingBottom: 1,
        minHeight: 5,
      }}
    >
      <text content={props.title} style={{ fg: TOKENS.text, marginBottom: 1 }} />
      <text content={props.description} style={{ fg: TOKENS.textMuted }} />
      {props.action ? <box style={{ marginTop: 1 }}>{props.action}</box> : null}
    </box>
  );
}

/* ─── Definition list ──────────────────────────────────────────────────── */

export function DefinitionList(props: {
  entries: Array<{ label: string; value: string }>;
}) {
  return (
    <box style={{ flexDirection: "column" }}>
      {props.entries.map((entry) => (
        <box
          key={entry.label}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            border: ["bottom"],
            borderColor: TOKENS.border,
            paddingTop: 0,
            paddingBottom: 0,
            height: 1,
          }}
        >
          <text content={entry.label} style={{ fg: TOKENS.textSubtle }} />
          <text content={entry.value} style={{ fg: TOKENS.text }} />
        </box>
      ))}
    </box>
  );
}

/* ─── Record preview ───────────────────────────────────────────────────── */

export function RecordPreview(props: { record: Record<string, unknown> }) {
  const keys = Object.keys(props.record).filter((key) => !key.startsWith("$"));
  return (
    <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
      {keys.length === 0 ? (
        <text content="No custom fields." style={{ fg: TOKENS.textSubtle }} />
      ) : (
        keys.map((key) => (
          <box key={key} style={{ flexDirection: "row", height: 1 }}>
            <text content={`${key}: `} style={{ fg: TOKENS.textSubtle }} />
            <text content={summarizeValue(props.record[key])} style={{ fg: TOKENS.text }} />
          </box>
        ))
      )}
    </scrollbox>
  );
}

/* ─── Data table ───────────────────────────────────────────────────────── */

export interface DataColumn<Row> {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  flexGrow?: number;
  align?: "left" | "right";
  tone?: "default" | "muted" | "subtle";
  render: (row: Row) => string;
}

export function DataTable<Row extends { $id: string }>(props: {
  columns: DataColumn<Row>[];
  rows: Row[];
  selectedId?: string | null;
  onSelect?: (row: Row) => void;
  emptyTitle: string;
  emptyDescription: string;
  footer?: React.ReactNode;
  compact?: boolean;
  showRowNumbers?: boolean;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <box style={{ flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      {/* Column header */}
      <box
        style={{
          flexDirection: "row",
          backgroundColor: TOKENS.panelAlt,
          border: ["bottom"],
          borderColor: TOKENS.borderStrong,
          height: 1,
        }}
      >
        {props.showRowNumbers ? (
          <box style={{ width: 4, paddingRight: 1 }}>
            <text content=" # " style={{ fg: TOKENS.textSubtle }} />
          </box>
        ) : null}
        {props.columns.map((column) => (
          <TableCell
            key={column.key}
            width={column.width}
            minWidth={column.minWidth}
            flexGrow={column.flexGrow}
            align={column.align}
            tone="subtle"
          >
            {truncate(column.label, column.width ?? column.minWidth ?? 30)}
          </TableCell>
        ))}
      </box>

      {/* Rows or empty state */}
      {props.rows.length === 0 ? (
        <EmptyState title={props.emptyTitle} description={props.emptyDescription} />
      ) : (
        <scrollbox style={{ flexGrow: 1, minHeight: 0 }}>
          {props.rows.map((row, index) => {
            const selected = props.selectedId === row.$id;
            const hovered = hoveredId === row.$id;
            return (
              <box
                key={row.$id}
                onMouseOver={() => setHoveredId(row.$id)}
                onMouseOut={() =>
                  setHoveredId((current) => (current === row.$id ? null : current))
                }
                onMouseDown={(event) => {
                  if (!props.onSelect) return;
                  event.preventDefault();
                  props.onSelect(row);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: selected
                    ? TOKENS.rowActive
                    : hovered
                      ? TOKENS.rowHover
                      : "transparent",
                  border: ["bottom"],
                  borderColor: TOKENS.border,
                  height: 1,
                }}
              >
                {props.showRowNumbers ? (
                  <box style={{ width: 4, paddingRight: 1 }}>
                    <text
                      content={String(index + 1).padStart(2)}
                      style={{ fg: TOKENS.textWeak }}
                    />
                  </box>
                ) : null}
                {props.columns.map((column) => (
                  <TableCell
                    key={`${row.$id}:${column.key}`}
                    width={column.width}
                    minWidth={column.minWidth}
                    flexGrow={column.flexGrow}
                    align={column.align}
                    tone={column.tone}
                  >
                    {truncate(column.render(row), column.width ?? column.minWidth ?? 30)}
                  </TableCell>
                ))}
              </box>
            );
          })}
        </scrollbox>
      )}

      {/* Footer */}
      {props.footer ? (
        <box
          style={{
            border: ["top"],
            borderColor: TOKENS.border,
            height: 1,
          }}
        >
          {props.footer}
        </box>
      ) : null}
    </box>
  );
}

/* ─── Toolbar ──────────────────────────────────────────────────────────── */

export function Toolbar(props: { children: React.ReactNode }) {
  return (
    <box
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 1,
        height: 1,
      }}
    >
      {props.children}
    </box>
  );
}

export function ToolbarGroup(props: { children: React.ReactNode; grow?: boolean }) {
  return (
    <box
      style={{
        flexDirection: "row",
        alignItems: "center",
        flexGrow: props.grow ? 1 : 0,
        flexShrink: props.grow ? 1 : 0,
        minWidth: props.grow ? 0 : undefined,
      }}
    >
      {props.children}
    </box>
  );
}

/* ─── Pagination ───────────────────────────────────────────────────────── */

export function Pagination(props: {
  total: number;
  offset: number;
  limit: number;
  onPrev: () => void;
  onNext: () => void;
  label?: string;
}) {
  const page = Math.floor(props.offset / props.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(props.total / props.limit));
  const hasPrev = props.offset > 0;
  const hasNext = props.offset + props.limit < props.total;

  return (
    <box
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        height: 1,
        marginTop: 1,
      }}
    >
      <text
        content={`${props.total} ${props.label ?? "items"}`}
        style={{ fg: TOKENS.textSubtle }}
      />
      <box style={{ flexDirection: "row", alignItems: "center" }}>
        <Button
          label="‹ Prev"
          onPress={props.onPrev}
          variant="ghost"
          compact
          disabled={!hasPrev}
        />
        <text
          content={` ${page} / ${totalPages} `}
          style={{ fg: TOKENS.textMuted }}
        />
        <Button
          label="Next ›"
          onPress={props.onNext}
          variant="ghost"
          compact
          disabled={!hasNext}
        />
      </box>
    </box>
  );
}

/* ─── Modal ────────────────────────────────────────────────────────────── */

export function Modal(props: {
  viewport: Viewport;
  title: string;
  description: string;
  width?: number;
  height?: number;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  const width = clamp(props.width ?? 80, 48, props.viewport.width - 6);
  const height = clamp(props.height ?? 26, 14, props.viewport.height - 4);
  const left = Math.max(2, Math.floor((props.viewport.width - width) / 2));
  const top = Math.max(1, Math.floor((props.viewport.height - height) / 2));

  return (
    <box
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: props.viewport.width,
        height: props.viewport.height,
        backgroundColor: TOKENS.overlay,
      }}
    >
      <box
        style={{
          position: "absolute",
          top,
          left,
          width,
          height,
          backgroundColor: TOKENS.shell,
          border: true,
          borderColor: TOKENS.borderStrong,
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <box
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingLeft: 2,
            paddingRight: 2,
            height: 3,
            border: ["bottom"],
            borderColor: TOKENS.border,
          }}
        >
          <box
            style={{
              flexDirection: "column",
              flexGrow: 1,
              flexShrink: 1,
              paddingRight: 2,
            }}
          >
            <text content={props.title} style={{ fg: TOKENS.text }} />
            <text content={props.description} style={{ fg: TOKENS.textSubtle }} />
          </box>
          <Button label="✕" onPress={props.onClose} variant="ghost" compact />
        </box>

        {/* Body */}
        <scrollbox
          style={{
            flexGrow: 1,
            minHeight: 0,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 1,
          }}
        >
          {props.children}
        </scrollbox>

        {/* Footer */}
        <box
          style={{
            border: ["top"],
            borderColor: TOKENS.border,
            paddingLeft: 2,
            paddingRight: 2,
            paddingTop: 1,
            paddingBottom: 1,
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          <box style={{ flexDirection: "row" }}>{props.footer}</box>
        </box>
      </box>
    </box>
  );
}
