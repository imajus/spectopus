## ADDED Requirements

### Requirement: Demo script discovers skills
The demo script SHALL use `withBazaar` from `@x402/extensions` to query x402 Bazaar for Spectopus skills and display available results.

#### Scenario: Discover skills
- **WHEN** the demo script runs
- **THEN** it queries Bazaar for available Spectopus skills and prints their descriptions, contract addresses, and pricing

### Requirement: Demo script downloads a skill
The demo script SHALL purchase and download a skill via x402 payment, demonstrating the full agent journey.

#### Scenario: Purchase and download
- **WHEN** the demo script selects a skill from Bazaar results
- **THEN** it makes an x402 payment and retrieves the SKILL.md content
