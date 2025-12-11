async function testApi() {
  try {
    console.log("Fetching all problems...");
    const problemsRes = await fetch(
      "https://codeforces.com/api/problemset.problems?lang=en"
    );
    if (!problemsRes.ok) throw new Error(`Status: ${problemsRes.status}`);
    const problemsData = await problemsRes.json();

    if (problemsData.status === "OK") {
      console.log(
        `Success! Fetched ${problemsData.result.problems.length} problems.`
      );
    } else {
      console.error("Failed to fetch problems:", problemsData.comment);
    }

    const handle = "tourist"; // Example handle
    console.log(`Fetching submissions for ${handle}...`);
    const submissionsRes = await fetch(
      `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=10&lang=en`
    );
    if (!submissionsRes.ok) throw new Error(`Status: ${submissionsRes.status}`);
    const submissionsData = await submissionsRes.json();

    if (submissionsData.status === "OK") {
      console.log(
        `Success! Fetched ${submissionsData.result.length} submissions.`
      );
      const firstSub = submissionsData.result[0];
      console.log("Sample submission:", JSON.stringify(firstSub, null, 2));
    } else {
      console.error("Failed to fetch submissions:", submissionsData.comment);
    }
  } catch (error) {
    console.error("Error running test:", error);
  }
}

testApi();
