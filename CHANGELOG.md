## 2024-04-13

### Changed
- Renamed `parsingCpuType` function to `parseCpuType`.
- Renamed `parsingMemoryType` function to `parseMemoryType`.
- Updated references to the renamed functions.
- Updated CPU_TYPE and MEMORY_TYPE values in the example file.
- Updated readme with a demo section showcasing local and AWS App Runner demos.

## 2024-04-12

### Added
- Added support for configuring the CPU and memory types for deployment in the CDK app runner.
- Added `CPU_TYPE` and `MEMORY_TYPE` environment variables in `bin/cohere-embed-v3-services.ts`.
- Added `cdkDeployCpuType` and `cdkDeployMemoryType` properties in `lib/CohereEmbedV3ServicesStackProps.ts`.
- Added `cdkDeployCpuType` and `cdkDeployMemoryType` variables in `lib/constructs/cohere-embded-v3-app-runner.ts`.
- Added `CPU_TYPE` and `MEMORY_TYPE` environment variables in `process-env.d.ts`.
- Added `parsingCpuType` and `parsingMemoryType` functions in `utils/check-hardware-input.ts`.

## 2024-04-10

### Added
- Added `embed_text` function to handle POST requests for text embedding.

### Changed
- Updated dependencies in `package-lock.json` and `package.json`.
- Updated environment variables in `.env.local`.
- Updated `docker-compose.yml` to use `.env` file for environment variables.