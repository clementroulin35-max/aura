# Implementation Plan - Emergency Nexus Recovery

The Atlantis Nexus has experienced a critical system failure ('WebGL Context Lost') caused by the heavy rendering requirements of the new Cerebro-Laboratory component. This plan restores the interface by implementing a 'Safe Mode' for the WebGL engine.

## User Review Required

> [!CAUTION]
> - **Visual Downgrade**: I will temporarily switch from `meshPhysicalMaterial` (refractive glass) to `meshStandardMaterial` (opaque/translucent glass) to reduce GPU pressure.
> - **Post-Processing Bypass**: I will disable the `Bloom` effect until the core rendering is stabilized.

## Proposed Changes

### [Component] [MODIFY] [BrainJar.jsx](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/portal/frontend/src/components/props/BrainJar.jsx)

- **Error Isolation**: Wrap the Canvas in a `Suspense` block and a local error handler.
- **Material Optimization**:
    - Change `meshPhysicalMaterial` to `meshStandardMaterial`.
    - Simplify the `EffectComposer` (or remove it for now).
- **Control**: Disable `OrbitControls` auto-rotation if it's contributing to the crash.

### [Component] [NEW] [SafeErrorBoundary.jsx](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/portal/frontend/src/components/shared/SafeErrorBoundary.jsx)

- Create a reusable Error Boundary to catch component-level crashes and display a "System Fault" placeholder instead of a blank screen.

### [Page] [MODIFY] [DashboardPage.jsx](file:///c:/Users/Clement/Gravity/AdaptativeIA/orion_v3/portal/frontend/src/pages/DashboardPage.jsx)

- Wrap `<BrainJar />` with `<SafeErrorBoundary />`.

## Verification Plan

### Automated Verification
- No automated tests for WebGL stability.

### Manual Verification
- Verify the Dashboard loads once again.
- Verify the BrainJar appears in its 'Safe Mode' configuration (simplified glass).
- Check the browser console for any remaining `Context Lost` warnings.
