export type UserItem = {
    id: number;
    username: string;
    type: string;
};

export type UsersResponse = {
    users: UserItem[];
};
