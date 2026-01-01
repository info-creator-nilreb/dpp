"use client"

import React from "react"

interface InputFieldProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  required?: boolean
  type?: string
  rows?: number
  helperText?: string
  disabled?: boolean
  readOnly?: boolean
}

/**
 * Input-Feld Komponente (separat, um Re-Rendering zu vermeiden)
 */
export default function InputField({ id, label, value, onChange, required = false, type = "text", rows = 1, helperText, disabled = false, readOnly = false }: InputFieldProps) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <label htmlFor={id} style={{
        display: "block",
        fontSize: "clamp(0.9rem, 2vw, 1rem)",
        fontWeight: "600",
        color: "#0A0A0A",
        marginBottom: "0.5rem"
      }}>
        {label} {required && <span style={{ color: "#E20074" }}>*</span>}
      </label>
      {rows > 1 ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          rows={rows}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            backgroundColor: disabled || readOnly ? "#F5F5F5" : "#FFFFFF",
            color: disabled || readOnly ? "#7A7A7A" : "#0A0A0A",
            boxSizing: "border-box",
            fontFamily: "inherit",
            resize: "vertical",
            cursor: disabled || readOnly ? "not-allowed" : "text"
          }}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          style={{
            width: "100%",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            fontSize: "clamp(0.9rem, 2vw, 1rem)",
            border: "1px solid #CDCDCD",
            borderRadius: "8px",
            backgroundColor: disabled || readOnly ? "#F5F5F5" : "#FFFFFF",
            color: disabled || readOnly ? "#7A7A7A" : "#0A0A0A",
            boxSizing: "border-box",
            cursor: disabled || readOnly ? "not-allowed" : "text"
          }}
        />
      )}
      {helperText && (
        <p style={{
          fontSize: "clamp(0.8rem, 1.6vw, 0.85rem)",
          color: "#7A7A7A",
          marginTop: "0.5rem",
          marginBottom: 0
        }}>
          {helperText}
        </p>
      )}
    </div>
  )
}

