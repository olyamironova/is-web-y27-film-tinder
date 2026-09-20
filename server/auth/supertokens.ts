import supertokens from 'supertokens-node';
import EmailPassword from 'supertokens-node/recipe/emailpassword';
import Session from 'supertokens-node/recipe/session';
import UserMetadata from 'supertokens-node/recipe/usermetadata';
import UserRoles from 'supertokens-node/recipe/userroles';
import { AuthModuleOptions, NAME_FORM_FIELD } from './auth.types.js';

export function initSupertokens(options: AuthModuleOptions): void {
  supertokens.init({
    framework: 'express',
    supertokens: {
      connectionURI: options.connectionUri,
      apiKey: options.apiKey,
    },
    appInfo: {
      appName: options.appName,
      apiDomain: options.apiDomain,
      websiteDomain: options.websiteDomain,
      apiBasePath: options.apiBasePath,
      websiteBasePath: '/login',
    },
    recipeList: [
      EmailPassword.init({
        signUpFeature: {
          formFields: [
            {
              id: NAME_FORM_FIELD,
              validate: async (value) => {
                const name = typeof value === 'string' ? value.trim() : '';
                if (name.length < 2) return 'Имя должно содержать минимум 2 символа';
                if (name.length > 80) return 'Имя не длиннее 80 символов';
                return undefined;
              },
            },
          ],
        },
        override: {
          apis: (original) => ({
            ...original,
            signUpPOST: async (input) => {
              if (original.signUpPOST === undefined) {
                throw new Error('signUpPOST is not available');
              }
              const response = await original.signUpPOST(input);
              if (response.status === 'OK') {
                const userId = response.user.id;
                const nameField = input.formFields.find((field) => field.id === NAME_FORM_FIELD);
                const name = typeof nameField?.value === 'string' ? nameField.value.trim() : '';
                await UserMetadata.updateUserMetadata(userId, { name });
                await UserRoles.addRoleToUser(input.tenantId, userId, options.userRole);
                await response.session.fetchAndSetClaim(UserRoles.UserRoleClaim);
              }
              return response;
            },
          }),
        },
      }),
      Session.init({
        getTokenTransferMethod: () => 'cookie',
      }),
      UserRoles.init(),
      UserMetadata.init(),
    ],
  });
}

export async function ensureRolesExist(options: AuthModuleOptions): Promise<void> {
  await UserRoles.createNewRoleOrAddPermissions(options.adminRole, []);
  await UserRoles.createNewRoleOrAddPermissions(options.userRole, []);
}
