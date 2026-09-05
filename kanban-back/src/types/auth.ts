export type JwtPayload = {
  sub: string;
  email: string;
  typ: 'access' | 'refresh';
};

export type RequestUser = {
  id: string;
  email: string;
};

export type RequestBoardAccess = {
  boardId: string;
  member: {
    id: string;
    boardId: string;
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER';
  };
};
