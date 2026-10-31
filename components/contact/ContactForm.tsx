"use client";

import Script from "next/script";
import { ArrowUpRight, Send, Search, ChevronDown, Check, X } from "lucide-react";
import { ChangeEvent, FormEvent, useState, useRef, useEffect } from "react";
import { COUNTRIES, validatePhoneNumber, type Country } from "@/lib/countries";

type SendState = "idle" | "sending" | "success" | "error";

interface ContactResponse {
  message?: string;
  error?: string;
}

export function ContactForm() {
  const [state, setState] = useState<SendState>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [messageWordCount, setMessageWordCount] = useState(0);

  // Country Code Selection State (must select either a country, None, or Custom)
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const customCodeInputRef = useRef<HTMLInputElement>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Close country dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    }
    if (countryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [countryDropdownOpen]);

  function updateMessageCount(event: ChangeEvent<HTMLTextAreaElement>) {
    const message = event.currentTarget.value;
    setMessageWordCount(message.trim() ? message.trim().split(/\s+/u).length : 0);
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const cleanDigits = event.currentTarget.value.replace(/\D/g, "");
    setPhoneNumber(cleanDigits);
  }

  function handleCustomCodeChange(event: ChangeEvent<HTMLInputElement>) {
    const cleanCode = event.currentTarget.value.replace(/[^0-9]/g, "");
    setCustomCode(cleanCode);
  }

  function handleSelectCountry(c: Country) {
    setSelectedCountry(c);
    setCountryDropdownOpen(false);
    setCountrySearch("");

    if (c.code === "NONE") {
      setPhoneNumber("");
      setCustomCode("");
    } else if (c.code === "CUSTOM") {
      setPhoneNumber("");
      setTimeout(() => customCodeInputRef.current?.focus(), 60);
    } else {
      setCustomCode("");
      setTimeout(() => phoneInputRef.current?.focus(), 60);
    }
  }

  function handlePhoneFieldClick() {
    if (!selectedCountry) {
      setCountryDropdownOpen(true);
    } else if (selectedCountry.code === "CUSTOM" && !customCode.trim()) {
      customCodeInputRef.current?.focus();
    }
  }

  const filteredCountries = countrySearch.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.dialCode.replace("+", "").includes(countrySearch.replace("+", "")) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES;

  // Determine phone disabled state
  const isNoneSelected = selectedCountry?.code === "NONE";
  const isCustomSelected = selectedCountry?.code === "CUSTOM";
  const isPhoneDisabled = !selectedCountry || isNoneSelected || (isCustomSelected && !customCode.trim());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const message = String(data.get("message") ?? "").trim();
    const wordCount = message ? message.split(/\s+/u).length : 0;

    if (wordCount < 5 || wordCount > 5000) {
      setState("error");
      setStatusMessage("Your message must be between 5 and 5000 words.");
      return;
    }

    // Strict Country Code & Phone Validation
    if (!selectedCountry) {
      setState("error");
      setStatusMessage("Please select a Country Code first (or choose 'None' if you do not wish to provide a phone number).");
      setCountryDropdownOpen(true);
      return;
    }

    let phone = "";
    if (selectedCountry.code === "NONE") {
      phone = "";
    } else if (selectedCountry.code === "CUSTOM") {
      const cleanCode = customCode.replace(/\D/g, "");
      const cleanDigits = phoneNumber.replace(/\D/g, "");
      if (!cleanCode) {
        setState("error");
        setStatusMessage("Please enter your custom dial code (e.g. 91) before submitting.");
        customCodeInputRef.current?.focus();
        return;
      }
      if (!cleanDigits) {
        setState("error");
        setStatusMessage("Please enter your phone number.");
        phoneInputRef.current?.focus();
        return;
      }
      if (cleanDigits.length < 7 || cleanDigits.length > 15) {
        setState("error");
        setStatusMessage(`Phone number must be between 7 and 15 digits (currently ${cleanDigits.length} digits).`);
        phoneInputRef.current?.focus();
        return;
      }
      phone = `+${cleanCode} ${cleanDigits}`;
    } else {
      const cleanDigits = phoneNumber.replace(/\D/g, "");
      if (!cleanDigits) {
        setState("error");
        setStatusMessage(`Please enter your phone number for ${selectedCountry.name}.`);
        phoneInputRef.current?.focus();
        return;
      }
      const validation = validatePhoneNumber(selectedCountry.code, cleanDigits);
      if (!validation.valid) {
        setState("error");
        setStatusMessage(validation.error || "Please enter a valid phone number.");
        phoneInputRef.current?.focus();
        return;
      }
      phone = `${selectedCountry.dialCode} ${cleanDigits}`;
    }

    setState("sending");
    setStatusMessage("");

    try {
      let captchaToken = "";
      if (siteKey) {
        if (!window.grecaptcha) throw new Error("Security check is still loading. Please try again.");
        captchaToken = await new Promise<string>((resolve, reject) => {
          window.grecaptcha?.ready(() => {
            window.grecaptcha?.execute(siteKey, { action: "contact" }).then(resolve).catch(reject);
          });
        });
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          phone,
          message,
          captchaToken,
        }),
      });

      const result = (await response.json()) as ContactResponse;
      if (!response.ok) throw new Error(result.error ?? "Something went wrong. Please try again.");

      form.reset();
      setPhoneNumber("");
      setCustomCode("");
      setSelectedCountry(null);
      setMessageWordCount(0);
      setState("success");
      setStatusMessage(result.message ?? "Message sent successfully.");
    } catch (error) {
      setState("error");
      setStatusMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      {siteKey ? <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="lazyOnload" /> : null}
      <form className="contact-form" onSubmit={onSubmit} aria-label="Contact form">
        <div className="field-row">
          <div className="field">
            <label htmlFor="contact-name">
              Name <span className="accent">*</span>
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              inputMode="text"
              autoComplete="name"
              autoCorrect="on"
              spellCheck={true}
              required
              minLength={2}
              maxLength={80}
              placeholder="Your name"
            />
          </div>

          <div className="field">
            <label htmlFor="contact-email">
              Email <span className="accent">*</span>
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              maxLength={254}
              pattern="[^@\s]+@[^@\s]+\.com"
              title="Use an email address ending in .com."
              placeholder="you@example.com"
            />
          </div>
        </div>

        {/* Country Code and Phone Number Fields */}
        <div className="field-row">
          {/* Country Code Selector with Search Dropdown */}
          <div className="field" ref={dropdownRef}>
            <label htmlFor="country-selector-trigger">
              Country Code <span className="accent">*</span>
            </label>

            <div className="country-select-wrapper">
              <button
                id="country-selector-trigger"
                type="button"
                className={`country-select-btn ${countryDropdownOpen ? "is-active" : ""}`}
                onClick={() => setCountryDropdownOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={countryDropdownOpen}
              >
                <div className="country-select-btn-left">
                  {selectedCountry ? (
                    <>
                      <span className="country-flag">{selectedCountry.flag}</span>
                      <strong className="country-code-text">
                        {selectedCountry.code === "NONE" ? "None" : selectedCountry.code === "CUSTOM" ? "Custom" : selectedCountry.dialCode}
                      </strong>
                      {selectedCountry.code !== "NONE" && selectedCountry.code !== "CUSTOM" && (
                        <span className="country-name-hint muted">({selectedCountry.name})</span>
                      )}
                    </>
                  ) : (
                    <span className="country-placeholder" style={{ color: "var(--subtle)" }}>Select Country Code (or None)</span>
                  )}
                </div>
                <ChevronDown size={14} className={`country-chevron ${countryDropdownOpen ? "is-flipped" : ""}`} />
              </button>

              {/* Searchable Dropdown Popover */}
              {countryDropdownOpen && (
                <div className="country-dropdown-popover" role="listbox">
                  <div className="country-search-bar">
                    <Search size={14} className="accent" />
                    <input
                      ref={searchInputRef}
                      className="country-search-input"
                      type="text"
                      inputMode="text"
                      placeholder="Search country or code (e.g. India, 91, US)..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                    />
                    {countrySearch && (
                      <button
                        type="button"
                        onClick={() => setCountrySearch("")}
                        style={{ border: 0, background: "transparent", color: "var(--muted)", cursor: "pointer" }}
                        aria-label="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="country-list-scroll">
                    {filteredCountries.map((c) => {
                      const isSelected = selectedCountry?.code === c.code;
                      return (
                        <button
                          key={`${c.code}-${c.dialCode}`}
                          type="button"
                          className={`country-item-btn ${isSelected ? "is-selected" : ""} ${c.code === "NONE" ? "is-none" : ""} ${c.code === "CUSTOM" ? "is-custom" : ""}`}
                          onClick={() => handleSelectCountry(c)}
                        >
                          <span className="country-item-left">
                            <span className="country-flag">{c.flag}</span>
                            <span className="country-item-name">{c.name}</span>
                          </span>
                          <span className="country-item-right">
                            <strong className="accent">
                              {c.code === "NONE" ? "None" : c.code === "CUSTOM" ? "+Custom" : c.dialCode}
                            </strong>
                            {isSelected && <Check size={12} style={{ marginLeft: 6 }} />}
                          </span>
                        </button>
                      );
                    })}

                    {filteredCountries.length === 0 && (
                      <div style={{ padding: "16px", textAlign: "center", color: "var(--subtle)", fontSize: 11 }}>
                        No country found matching &ldquo;{countrySearch}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <span className="field-hint">
              {selectedCountry
                ? selectedCountry.code === "NONE"
                  ? "None selected: phone input is disabled."
                  : selectedCountry.code === "CUSTOM"
                  ? "Custom code selected: write your dial code first."
                  : selectedCountry.code === "IN"
                  ? "India (+91): Requires exactly 10 digits."
                  : `Selected: ${selectedCountry.name} (${selectedCountry.dialCode})`
                : "Select Country Code or 'None' to proceed"}
            </span>
          </div>

          {/* Phone Number Input (with Custom Code support and Number-only Mobile Keyboard) */}
          <div className="field" onClick={handlePhoneFieldClick}>
            <label htmlFor="contact-phone">
              Phone number{" "}
              {selectedCountry?.code === "NONE" ? (
                <span className="muted">(Not provided)</span>
              ) : selectedCountry ? (
                <span className="accent">*</span>
              ) : (
                <span className="muted">(Select code first)</span>
              )}
            </label>

            <div className={`field-input-prefix ${isPhoneDisabled ? "is-locked" : ""}`}>
              {isCustomSelected ? (
                <div className="custom-code-box" onClick={(e) => e.stopPropagation()}>
                  <span className="custom-code-plus">+</span>
                  <input
                    ref={customCodeInputRef}
                    id="contact-custom-code"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    autoCorrect="off"
                    placeholder="Code"
                    value={customCode}
                    onChange={handleCustomCodeChange}
                    maxLength={5}
                    className="custom-code-input"
                    title="Write your custom country dial code"
                  />
                </div>
              ) : (
                <span aria-hidden="true" style={{ color: selectedCountry ? "var(--orange)" : "var(--subtle)", fontWeight: 700 }}>
                  {isNoneSelected ? "🚫" : selectedCountry ? selectedCountry.dialCode : "+"}
                </span>
              )}

              <input
                ref={phoneInputRef}
                id="contact-phone"
                name="phoneNumber"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="tel"
                autoCorrect="off"
                autoCapitalize="none"
                disabled={isPhoneDisabled}
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder={
                  !selectedCountry
                    ? "Select country code first"
                    : isNoneSelected
                    ? "Phone disabled (None selected)"
                    : isCustomSelected && !customCode.trim()
                    ? "Write custom code first"
                    : selectedCountry.code === "IN"
                    ? "10-digit mobile number"
                    : "Enter phone number"
                }
                maxLength={15}
                style={{
                  cursor: isPhoneDisabled ? "not-allowed" : "text",
                  opacity: isNoneSelected ? 0.6 : 1,
                }}
              />
            </div>

            <span className="field-hint">
              {!selectedCountry ? (
                <span style={{ color: "var(--orange)" }}>⚠️ Select country code first to type phone</span>
              ) : isNoneSelected ? (
                <span style={{ color: "var(--subtle)" }}>🚫 Phone input is disabled for &apos;None&apos;</span>
              ) : isCustomSelected && !customCode.trim() ? (
                <span style={{ color: "var(--orange)" }}>✏️ Write your country dial code before typing phone</span>
              ) : selectedCountry.code === "IN" ? (
                <span>
                  {phoneNumber.length === 10 ? (
                    <strong style={{ color: "#4ade80" }}>✓ 10 digits entered</strong>
                  ) : (
                    <span>Indian numbers require exactly 10 digits ({phoneNumber.length}/10)</span>
                  )}
                </span>
              ) : (
                <span>Digits only ({phoneNumber.length} digits entered)</span>
              )}
            </span>
          </div>
        </div>

        {/* Message Field */}
        <div className="field">
          <label htmlFor="contact-message">
            Message <span className="accent">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            inputMode="text"
            required
            minLength={9}
            maxLength={100000}
            onChange={updateMessageCount}
            placeholder="Tell me a little about what you're working on…"
          />
          <p className="field-hint">
            Minimum 5 words · Maximum 5000 words · {messageWordCount} words
          </p>
        </div>

        <div className="form-bottom">
          <p className="form-note">Your message goes directly to my inbox.</p>
          <button className="button" type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send message"} {state === "sending" ? <Send size={13} /> : <ArrowUpRight size={14} />}
          </button>
        </div>

        <p className="form-status" data-state={state} role="status" aria-live="polite">
          {statusMessage}
        </p>
      </form>
    </>
  );
}
