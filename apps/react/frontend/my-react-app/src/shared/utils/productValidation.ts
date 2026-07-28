interface ProductCandidate {
  id: number;
}

interface VerifiedProduct {
  id: number;
  is_hidden?: boolean;
}

export const mergeVerifiedProducts = <
  TCandidate extends ProductCandidate,
  TVerified extends VerifiedProduct,
>(
  candidates: TCandidate[],
  verifiedProducts: TVerified[],
): Array<TCandidate & TVerified> => {
  const verifiedById = new Map(
    verifiedProducts
      .filter((product) => product.is_hidden !== true)
      .map((product) => [product.id, product]),
  );

  return candidates.flatMap((candidate) => {
    const verified = verifiedById.get(candidate.id);
    return verified ? [{ ...candidate, ...verified }] : [];
  });
};
