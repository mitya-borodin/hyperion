import { Theme, User } from "@prisma/client";

import { Theme as DomainTheme, User as DomainUser } from "../../../domain/user";

export const mapToDomainUser = (prismaUser: User): DomainUser => {
  let theme: DomainTheme = DomainTheme.LIGHT;

  if (prismaUser.theme === Theme.LIGHT) {
    theme = DomainTheme.LIGHT;
  }

  if (prismaUser.theme === Theme.DARK) {
    theme = DomainTheme.DARK;
  }

  return {
    id: prismaUser.id,
    email: prismaUser.email,
    accountName: prismaUser.accountName ?? "",
    theme,
  };
};
