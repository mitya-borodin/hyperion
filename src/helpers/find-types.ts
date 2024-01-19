export type FindParameters = {
  search?: string;
  pagination: {
    page: number;
    limit: number;
  };
};

export type FindResult<T> = {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
};
