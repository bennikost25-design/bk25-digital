import { describe, expect, it } from "vitest";
import { renderEmail } from "@/lib/mail/templates";

describe("mail templates HTML shell", () => {
  it("renders a brand-aligned transactional layout for contact-confirm", () => {
    const email = renderEmail("contact-confirm", {
      name: "Alex <script>",
    });

    expect(email.subject).toBe("Ihre Anfrage bei BK25 Digital");
    expect(email.text).toContain("Viele Grüße\nBenjamin Kost\nBK25 Digital");
    expect(email.text).toContain("Guten Tag Alex <script>,");

    const { html } = email;
    expect(html).toContain('name="viewport"');
    expect(html).toContain("max-width:620px");
    expect(html).toContain("BK</span>");
    expect(html).toContain('color:#9b7cff;padding:0 1px;">/</span>');
    expect(html).toContain(">25</span>");
    expect(html).toContain("DIGITAL");
    expect(html).toContain("BK25 DIGITAL · BESTÄTIGUNG");
    expect(html).toContain("Anfrage eingegangen");
    expect(html).toContain("Alex &lt;script&gt;");
    expect(html).not.toContain("Alex <script>");
    expect(html).toContain("Viele Grüße<br>Benjamin Kost<br>BK25 Digital");
    expect(html).toContain("email-signature");
    expect(html).toContain("kontakt@bk25digital.de");
    expect(html).toContain("Diese Nachricht wurde über BK25 Digital versendet.");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("data:image");
    expect(html).not.toContain("min-height");
    expect(html).not.toContain("display:flex");
    expect(html).not.toContain("display:grid");
  });

  it("keeps subjects and plain text stable for other templates", () => {
    const invite = renderEmail("invite-setup", {
      name: "Sam",
      actionUrl: "https://example.test/setup",
    });
    expect(invite.subject).toBe("Ihr BK25-Kundenkonto einrichten");
    expect(invite.text).toContain("https://example.test/setup");
    expect(invite.html).toContain('href="https://example.test/setup"');
    expect(invite.html).toContain("BK25 DIGITAL · KONTO");

    const admin = renderEmail("contact-admin", {});
    expect(admin.subject).toBe("Neue Kontaktanfrage im BK25-Adminbereich");
    expect(admin.text).toBe(
      "Im geschützten Adminbereich liegt eine neue Kontaktanfrage vor.",
    );
    expect(admin.html).toContain("BK25 DIGITAL · ADMIN");
  });
});
