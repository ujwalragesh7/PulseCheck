export const handler = async () => {
  console.log("PulseCheck monitor checker running");

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "PulseCheck monitor checker is working",
    }),
  };
};