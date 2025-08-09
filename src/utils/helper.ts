import { IUser } from "../@types/type";

export const findAvailableUser = (
  connectedUser: IUser[],
  excludeUserId?: string
) => {
  return connectedUser.find(
    (user) => user?.isAvailable && user.socketId !== excludeUserId
  );
};
