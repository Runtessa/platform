# Authoring and publication

The Studio manages a tenant workspace rather than editing the platform repository
itself. Modules, models, UI packages and ACL each have their own persistence and
runtime rules. Understanding those differences prevents accidental deployment changes.

## A workspace in the browser

The editor combines a file explorer with Monaco editing, split views, diffs,
search and open-file tabs. Dedicated panels expose history, staging, AI assistance
and preview inspection. ACL files also have a structured side form that edits the
same JSON buffer used by Monaco.

Workspace resources are saved through IDE APIs to Core-owned application records.
The platform's source files remain in Git; tenant artifacts live in its databases.

## Drafts and published artifacts

| Action | Module/UI effect | What to check |
| --- | --- | --- |
| Edit a buffer | Changes local editor content | Unsaved changes and selected tenant |
| Save | Updates draft/source and related compilation metadata | Errors and dependencies |
| Preview draft | Reads the authoring state with authorized developer context | Tenant, stage and package |
| Publish | Selects the module/UI artifacts consumed by published runtime | Route, exports, dependencies and ACL |
| Restore a revision | Restores prior source to a new draft state | Diff, configuration and data compatibility |
| Republish restored source | Makes the selected restored module/UI code active | Published preview and a real request |

Module publication snapshots route, method, source and file extension. UI publication
selects source, compiled output and dependency metadata. Their published caches are
invalidated so later loads/invocations can resolve the updated artifacts.

A publication action is not a distributed transaction covering code, ACL, models,
data, configuration and shared packages. Plan changes spanning those areas deliberately.

## Preview the right state

Preview uses the tenant shell and Kernel runtime. The preview URL identifies the
package, version, tenant hostname, stage and inspection session. The stage is
`draft` or `published`; development source mode adds runtime source maps, with a
bundle fallback.

Draft backend/registry access requires authenticated DEVELOPER/ADMIN context bound
to the selected tenant. A raw preview header or arbitrary tenant hostname does not
grant draft access. Published requests resolve the selected published code.

When behavior differs between stages, compare:

1. Selected tenant and authenticated developer context.
2. Package/module name and route.
3. Draft versus published source, compiled output and dependencies.
4. Default versus named exports and import names.
5. ACL, adapter grants and model schema readiness.

## Review, stage and publish

Staging and publication-request screens expose selected resources for review.
The request's tenant and each resource permission are checked; shared publication
also checks the owning team/project. Use diffs and revision history to understand
what the selected application change does before publishing it.

Publish dependent UI/shared packages deliberately. Do not assume that publishing
one file makes every unpublished dependency available. Validate both draft preview
and the published runtime path.

## History and rollback

Module/UI revision APIs preserve source snapshots and support restoration. Restoring
older source changes the draft; it does not silently replace the currently published
artifact. Review it and republish through the same workflow.

Assistant rollback also validates batch scope and permissions. Neither code history
nor source rollback restores database contents, secrets or external side effects.
For schema/data recovery, use a tested database backup and migration plan.

## Models have a separate schema lifecycle

Models are executable JavaScript classes. The model-save APIs compile and persist
source; the Studio's save-one/save-all actions then attempt `/api/models/migrate`.
That endpoint performs TypeORM schema synchronization for the selected/default
granted connection in a restricted process. Review the intended schema change
**before saving a model against existing data**. A failed schema operation does
not imply the preceding source save was undone.

This tenant schema operation is not the checksummed platform migration stream.
Models also do not have the same published snapshot lifecycle as modules/UI packages.

A live module can fail after a model edit if the relevant table/column/relation is
not ready. For existing data:

1. Back up the tenant's database and record its adapter configuration.
2. Review the model and the operation required to change the schema.
3. Apply the supported model operation in an isolated/staging environment first.
4. Verify repository queries and relations before publishing dependent modules.

Core/IDE platform tables use an independent checksummed migration history. Never
enable platform synchronization to repair tenant model configuration.

## ACL and configuration are not code publication

ACL JSON persists permission, role and endpoint policy. Adapter access, secret
references, hostname and registration policy are tenant configuration. A saved
configuration/policy change can affect runtime separately from module/UI publication.

Restrict anonymous access to deliberately public endpoints. When testing a draft,
use a real authorized tenant identity rather than weakening the endpoint policy.

## Continue reading

- [First application](../tutorials/first-application.md)
- [Backend and model recipes](../platform-cookbook/02-backend-modules.md)
- [ACL](../platform-cookbook/03-acl.md) and [UI](../platform-cookbook/04-ui-modules.md)
- [Shared projects](../platform-cookbook/05-shared-projects.md)
- [Runtime host requirements](../../docker/runtime/README.md)
