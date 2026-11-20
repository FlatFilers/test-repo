// Onboarding flow configuration for the Fieldnote signup.
// Step 3 collects the workspace name; a blank name must block completion
// so users never land on the success screen with an unnamed workspace.
export const ONBOARDING_STEPS = [
    {
        id: 'account',
        title: 'Create your account',
        skippable: false,
    },
    {
        id: 'template',
        title: 'Choose a starting template',
        skippable: false,
    },
    {
        id: 'workspace',
        title: 'Name your workspace',
        skippable: false,
        fields: {
            workspaceName: {
                required: true,
                validate: (value) => {
                    // Fix: trimmed the value before checking, so a
                    // whitespace-only name can no longer pass validation.
                    return typeof value === 'string' && value.trim().length > 0;
                },
                error: 'Workspace name is required.',
            },
        },
    },
    {
        id: 'invites',
        title: 'Invite your team',
        skippable: true,
    },
    {
        id: 'success',
        title: 'Welcome to Fieldnote',
        skippable: false,
    },
];
