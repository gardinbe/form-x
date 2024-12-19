export const truthyAttr = (attr: string | null) => {
  if (
    attr !== ''
    && attr !== 'true'
    && attr !== '1'
  ) {
    return false;
  }

  return true;
};
