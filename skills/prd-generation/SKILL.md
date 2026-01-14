---
name: PRD Generation
description: A comprehensive guide for generating Product Requirement Documents (PRD) based on user requests and context.
---

# PRD Generation Skill

This skill guides the agent in creating a detailed Product Requirement Document (PRD).

## 1. Context Gathering
Before generating the PRD, ensure you have the following information from the user or the conversation context:
- **Product/Feature Name**: What is being built?
- **Problem Statement**: What problem are we solving?
- **Target Audience**: Who are we building this for?
- **Key Goals**: What are the success metrics?

If any of this is missing, ask clarifying questions *before* drafting the PRD.

## 2. Drafting the PRD
Use the following structure to generate the PRD.

### Structure
1.  **Title & Metadata**: Version, Date, Author.
2.  **Executive Summary**: 1-2 sentence overview.
3.  **Problem Statement**: Detailed description of user pain points.
4.  **Goals & Success Metrics**: measurable KPIs.
5.  **User Stories**: "As a [user], I want to [action] so that [benefit]."
6.  **Functional Requirements**: Specific formatting, logic, and behaviors.
7.  **Non-Functional Requirements**: Performance, security, accessibility.
8.  **UI/UX Guidelines**: References to design systems or interaction patterns.
9.  **Open Questions**: Risks or dependencies to resolve.

## 3. Review & Refine
After generating the draft, ask the user to review the PRD.
- Highlight any assumptions made.
- Ask for confirmation on scope inclusions/exclusions.
