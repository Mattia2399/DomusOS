# Feature status

Updated: 2026-09-02

This page distinguishes usable beta functionality from previews and planned work. **Operational** means that the primary path is implemented and covered by project tests; it does not guarantee compatibility with every Home Assistant hardware integration.

## Pages

| Page        | Status           | Available experience                                                                               |
| ----------- | ---------------- | -------------------------------------------------------------------------------------------------- |
| Home        | Beta operational | Dashboard, cards, contextual panels, builder, stacks, versions, and shared layout                  |
| Rooms       | Beta operational | Floor/room browsing and controls for entities authorized by HA                                     |
| Security    | Beta operational | Alarm hub, cameras, selectable sensors, and shared authorization                                   |
| Consumption | Beta operational | Views based on data actually available in HA                                                       |
| Profile     | Beta operational | Personal preferences and device theme                                                              |
| Settings    | Beta operational | Home, entities, people, system, backups, versions, and attention preferences                       |
| App Gallery | Partial          | Launcher and Irrigation beta are available; Utility Room and Pool & Spa are marked as coming later |
| Automations | Coming later     | The old workspace remains disabled until its workflow is ready for beta use                        |

## Cards and controls

| Family                 | Status                                 | Known limitations                                                                         |
| ---------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Sensor, Light, Switch  | Verified                               | Primary paths tested with real entities                                                   |
| Alarm, Lock            | Verified with limitations              | HA remains the final authorization authority; the beta is not a certified security system |
| Camera, Media Player   | Beta operational                       | Advanced features depend on capabilities exposed by the entity/device                     |
| Climate, Cover, Vacuum | Operational, partially hardware-tested | Not every hardware and feature combination has been tested                                |
| Members                | Beta operational                       | Depends on the available person/device-tracker entities                                   |

## Planned after the beta

- Calendar and Calendar card;
- map and location management;
- shopping/Todo lists;
- Utility Room and Pool & Spa apps;
- redesigned Automation Builder;
- desktop editing of layouts later used on mobile;
- richer notifications and contextual snackbars;
- configuration sharing through QR codes;
- official app.

Unavailable pages and apps must use `FeatureAvailabilityPage`. Incomplete functionality must never be presented as operational or left in an ambiguous state.
