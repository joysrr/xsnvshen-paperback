import { z } from "zod";

export const dummySchema = z.object({
  message: z.string(),
});
export type Dummy = z.infer<typeof dummySchema>;
