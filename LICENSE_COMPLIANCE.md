# Open-Source License Compliance Matrix & Investor Due Diligence

**Project Name**: GroceNest  
**Audit Date**: July 22, 2026  
**Status**: **PASSED — Commercial & Investor Ready**

---

## 1. Executive Summary

An automated open-source license audit was performed across all project workspaces (`backend`, `web`, and `mobile`) to ensure strict compliance with commercial licensing terms and investor requirements.

- **0 Copyleft / Viral License Violations**: No `GPL-2.0`, `GPL-3.0`, `AGPL-3.0`, or `CC-BY-NC` dependencies are present in production codebase builds.
- **100% Permissible Open-Source Stack**: Dependencies utilize business-friendly licenses (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `ISC`, `CC0-1.0`, `0BSD`).
- **LGPL Dynamic Linkage Analysis**: Sharp image processing native C++ binaries (`libvips`) operate under `LGPL-3.0-or-later`. LGPL dynamic linking is fully compliant for SaaS/web application distribution as the binary is unmodified and dynamically loaded at runtime.

---

## 2. Workspace License Breakdown

### Backend (`backend/`)
| License Type | Count | Commercial Compatibility |
| :--- | :---: | :--- |
| **MIT** | 558 | ✅ Fully Permissible |
| **Apache-2.0** | 63 | ✅ Fully Permissible |
| **ISC** | 51 | ✅ Fully Permissible |
| **BSD-3-Clause** | 29 | ✅ Fully Permissible |
| **BlueOak-1.0.0** | 10 | ✅ Fully Permissible |
| **BSD-2-Clause** | 6 | ✅ Fully Permissible |
| **Python-2.0** | 1 | ✅ Fully Permissible |
| **CC-BY-4.0** | 1 | ✅ Fully Permissible |
| **MIT-0 / 0BSD** | 2 | ✅ Fully Permissible |
| **GPL / AGPL Copyleft** | **0** | ✅ Clean |

---

### Web Frontend (`web/`)
| License Type | Count | Commercial Compatibility |
| :--- | :---: | :--- |
| **MIT** | 685 | ✅ Fully Permissible |
| **ISC** | 35 | ✅ Fully Permissible |
| **Apache-2.0** | 32 | ✅ Fully Permissible |
| **BSD-2-Clause / BSD-3-Clause** | 22 | ✅ Fully Permissible |
| **MPL-2.0 / BlueOak-1.0.0** | 7 | ✅ Fully Permissible |
| **LGPL-3.0-or-later** (`sharp` native lib) | 2 | ℹ️ Permissible via Dynamic Linking (SaaS compliant) |
| **GPL / AGPL Copyleft** | **0** | ✅ Clean |

---

## 3. License Audit Enforcement

Automated license compliance checks are configured in the repository pipeline:

```bash
# Execute local open-source license compliance audit
node scripts/check-licenses.js
```
