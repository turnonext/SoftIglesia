"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth-store";
import { getEffectiveNavRole, isPlatformUser } from "@/lib/auth/platform";
import {
  countSectionArticles,
  helpAnchorId,
  helpCategoriesForRole,
  helpSectionsForRole,
  listSectionArticles,
  POPULAR_HELP_SECTIONS,
} from "@/lib/help-sections";
import { HelpSectionDoc } from "@/components/help/help-section-doc";
import { HelpInfoIcon } from "@/components/help/help-info-icon";
import { Input } from "@/components/ui/input";

function normalizeQuery(q: string) {
  return q.trim().toLowerCase();
}

export function HelpCenter() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const user = useAuthStore((s) => s.user);
  const actingTenantSlug = useAuthStore((s) => s.actingTenantSlug);
  const navRole = getEffectiveNavRole(user, actingTenantSlug);
  const role = isPlatformUser(user) && !actingTenantSlug ? "platform" : navRole;
  const sections = helpSectionsForRole(role ?? undefined);
  const categories = helpCategoriesForRole(role ?? undefined);

  const normalizedQuery = normalizeQuery(query);

  const filteredCategories = useMemo(() => {
    if (!normalizedQuery) return categories;
    return categories
      .map((cat) => {
        const catTitle = t(cat.titleKey).toLowerCase();
        const matchedSections = cat.sections.filter((sectionId) => {
          const title = t(`help.sections.${sectionId}.title`).toLowerCase();
          const summary = t(`help.sections.${sectionId}.summary`).toLowerCase();
          const articles = listSectionArticles(sectionId, t);
          const articleMatch = articles.some((a) =>
            a.label.toLowerCase().includes(normalizedQuery)
          );
          return (
            catTitle.includes(normalizedQuery) ||
            title.includes(normalizedQuery) ||
            summary.includes(normalizedQuery) ||
            articleMatch
          );
        });
        return { ...cat, sections: matchedSections };
      })
      .filter((cat) => cat.sections.length > 0);
  }, [categories, normalizedQuery, t]);

  const visibleSections = useMemo(() => {
    if (!normalizedQuery) return sections;
    const ids = new Set(filteredCategories.flatMap((c) => c.sections));
    return sections.filter((id) => ids.has(id));
  }, [sections, filteredCategories, normalizedQuery]);

  const popularSections = useMemo(() => {
    const allowed = new Set(sections);
    return POPULAR_HELP_SECTIONS.filter((id) => allowed.has(id)).slice(0, 6);
  }, [sections]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="w-full -mx-4 sm:-mx-6 lg:-mx-8">
      <div
        className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
        style={{
          background: `linear-gradient(135deg, var(--brand-primary, #ff4e44) 0%, color-mix(in srgb, var(--brand-primary-hover, #de7571) 85%, var(--brand-primary)) 100%)`,
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {t("help.heroTitle")}
          </h1>
          <p className="mt-2 text-sm text-white/85 sm:text-base">{t("help.heroSubtitle")}</p>
          <div className="relative mx-auto mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("help.searchPlaceholder")}
              className="h-12 rounded-full border-0 bg-white pl-12 pr-5 text-base shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-white/50"
            />
          </div>
        </div>
      </div>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            <h2 className="text-lg font-bold">{t("help.topicsTitle")}</h2>

            {filteredCategories.length === 0 ? (
              <p className="mt-6 text-sm text-secondary">{t("help.searchEmpty")}</p>
            ) : (
              <div className="mt-6 grid gap-8 sm:grid-cols-2">
                {filteredCategories.map((cat) => {
                  const articleCount = cat.sections.reduce(
                    (n, sid) => n + countSectionArticles(sid, t),
                    0
                  );
                  return (
                    <div key={cat.id}>
                      <h3 className="text-base font-semibold text-foreground">
                        {t(cat.titleKey)}{" "}
                        <span className="font-normal text-muted-foreground">
                          ({t("help.articleCount", { count: articleCount })})
                        </span>
                      </h3>
                      <ul className="mt-3 space-y-4">
                        {cat.sections.map((sectionId) => (
                          <li key={sectionId}>
                            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-brand-primary">
                              {t(`help.sections.${sectionId}.title`)}
                            </p>
                            <ul className="space-y-2">
                              {listSectionArticles(sectionId, t).map((article, idx) => (
                                <li key={`${sectionId}-${idx}`}>
                                  <Link
                                    href={article.href}
                                    className="group flex items-start gap-2.5 text-sm text-foreground/90 transition-colors hover:text-brand-primary"
                                  >
                                    <HelpInfoIcon size="sm" variant="soft" className="mt-0.5 opacity-85 group-hover:opacity-100" />
                                    <span className="leading-snug">{article.label}</span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}

            {visibleSections.length > 0 && (
              <div className="mt-12 space-y-6 border-t border-border/60 pt-10">
                <h2 className="text-lg font-bold">{t("help.fullGuidesTitle")}</h2>
                {visibleSections.map((id) => (
                  <HelpSectionDoc key={id} sectionId={id} />
                ))}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="rounded-xl bg-muted/40 p-5">
              <h2 className="text-base font-bold">{t("help.popularTitle")}</h2>
              <ul className="mt-4 space-y-3">
                {popularSections.map((sectionId) => (
                  <li key={sectionId}>
                    <Link
                      href={`#${helpAnchorId(sectionId)}`}
                      className="group flex items-start gap-2.5 text-sm text-foreground/90 hover:text-brand-primary"
                    >
                      <HelpInfoIcon size="sm" variant="soft" className="mt-0.5 shrink-0" />
                      <span className="leading-snug">{t(`help.sections.${sectionId}.title`)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
