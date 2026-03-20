export type UserItem = {
    id: number;
    username: string | null;
    email?: string | null;
    type: string;
};

export type UsersResponse = {
    users: UserItem[];
};
