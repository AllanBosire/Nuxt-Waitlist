import z from "zod";

export default z.object({
  page: z.string().transform((val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return 1;
    return num;
  }),
  items: z.string().transform((val) => {
    const num = Number(val);
    if (Number.isNaN(num)) return 1;
    return num;
  }),
});
