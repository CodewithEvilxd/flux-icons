# Tools & Internal Generators

This directory contains standalone geometrical scripts, mathematical shape solvers, and Figma inspection utilities used during drawing and review sessions.

## Overview

| Directory / Script | Purpose |
| --- | --- |
| `ink-box-figma.js` | Ink boundary and optical padding highlighter for the Figma Catalog page. |
| `v5/` | Precision 2D path geometry: parallel contour offsets, arc clipping, vertex normals. |
| `badge/` | Algorithmic generator for scalloped 8-bump rosette containers. |
| `batch-*/` | Generation scripts for discrete icon batches and container variations. |
| `panels/`, `people/`, `truck/` | Specialized geometric builders for multi-part icon families. |

Outputs from these generators are reviewed and emitted into `raw/`, which serves as the pipeline's single source of truth.
