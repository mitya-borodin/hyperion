import type { User as DomainUser } from "../../../domain/user";
import type { User as InterfaceUser } from "../types/user";

export const mapToInterfaceUser = (domainUser: DomainUser): InterfaceUser => {
  return {
    ...domainUser,
    id: String(domainUser.id),
  };
};

export const mapToDomainUser = (interfaceUser: InterfaceUser): DomainUser => {
  return {
    ...interfaceUser,
    id: parseInt(interfaceUser.id),
  };
};
