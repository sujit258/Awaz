async function main() {
  console.log("🚀 Testing Anonymous Complaint E2E Flow...");

  // Fetch real issue
  const issuesRes = await fetch("http://localhost:3000/api/v1/issues");
  const issuesData = await issuesRes.json();
  const targetIssue = issuesData.issues?.[0];
  if (!targetIssue) {
    throw new Error("No issues found on platform!");
  }
  console.log(`Targeting issue: ${targetIssue.title} (${targetIssue.id})`);

  // 1. Submit anonymous complaint
  const payload = {
    issueId: targetIssue.id,
    companyId: "flipkart",
    description: "Automated E2E test complaint: Package stalled at regional courier hub for 4 days without updates.",
    summary: "Package stalled at courier hub for 4 days",
    approximateRegion: "Maharashtra",
    confirmationAccurate: true,
    confirmationConsent: true,
  };

  const submitRes = await fetch("http://localhost:3000/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const submitData = await submitRes.json();
  console.log("Submission status:", submitRes.status);
  console.log("Submission result:", submitData);

  if (!submitRes.ok || !submitData.accessKey || !submitData.report?.referenceNumber) {
    throw new Error("Anonymous submission failed: " + JSON.stringify(submitData));
  }

  const { referenceNumber, id } = submitData.report;
  const { accessKey } = submitData;

  console.log(`✅ Created anonymous report ${referenceNumber} with accessKey: ${accessKey}`);

  // 2. Test Public Lookup (Without Key)
  const publicRes = await fetch(`http://localhost:3000/api/v1/reports/track?ref=${encodeURIComponent(referenceNumber)}`);
  const publicData = await publicRes.json();
  console.log("Public lookup (without key):", publicData);

  if (publicData.isAuthorized !== false || publicData.publicReport?.description !== undefined) {
    throw new Error("Security leak: Public lookup exposed authorized state or private description!");
  }
  console.log("✅ Public lookup strictly returned unauthenticated projection (no private description).");

  // 3. Test Authorized Lookup (With Key via Protected Header)
  const authRes = await fetch(
    `http://localhost:3000/api/v1/reports/track?ref=${encodeURIComponent(referenceNumber)}`,
    {
      headers: {
        "x-awaz-access-key": accessKey,
      },
    }
  );
  const authData = await authRes.json();
  console.log("Authorized lookup (with header key):", authData);

  if (!authData.isAuthorized || !authData.report?.description) {
    throw new Error("Authorized lookup failed to retrieve owner details!");
  }
  console.log("✅ Authorized lookup verified x-awaz-access-key header and returned owner report.");

  // 3b. Verify query parameter transport NEVER authorizes private access
  const queryParamRes = await fetch(
    `http://localhost:3000/api/v1/reports/track?ref=${encodeURIComponent(referenceNumber)}&accessKey=${encodeURIComponent(accessKey)}`
  );
  const queryParamData = await queryParamRes.json();
  if (queryParamData.isAuthorized !== false) {
    throw new Error("Security failure: Query parameter transport unexpectedly authorized access!");
  }
  console.log("✅ Confirmed: Query parameter accessKey is ignored and does NOT authorize private access.");

  // 4. Test Status Update via Access Key
  const updateRes = await fetch(`http://localhost:3000/api/v1/reports/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-awaz-access-key": accessKey,
    },
    body: JSON.stringify({
      complaintStatus: "RESOLVED_BY_CUSTOMER",
      resolutionOutcome: "Delivered late with compensation voucher",
    }),
  });

  const updateData = await updateRes.json();
  console.log("Update status response:", updateData);
  if (!updateRes.ok || updateData.report?.complaintStatus !== "RESOLVED_BY_CUSTOMER") {
    throw new Error("Status update failed: " + JSON.stringify(updateData));
  }
  console.log("✅ Status updated to RESOLVED_BY_CUSTOMER using accessKey.");

  // 5. Test Deletion / Withdrawal via Access Key
  const deleteRes = await fetch(`http://localhost:3000/api/v1/reports/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-awaz-access-key": accessKey,
    },
    body: JSON.stringify({
      confirmDeletion: true,
      reason: "E2E test complete withdrawal",
    }),
  });

  const deleteData = await deleteRes.json();
  console.log("Delete response:", deleteData);
  if (!deleteRes.ok) {
    throw new Error("Deletion failed: " + JSON.stringify(deleteData));
  }
  console.log("✅ Report successfully withdrawn and scrubbed.");

  // 6. Verify deleted report is no longer returned
  const postDeleteRes = await fetch(`http://localhost:3000/api/v1/reports/track?ref=${encodeURIComponent(referenceNumber)}`);
  console.log("Post-delete lookup status:", postDeleteRes.status);
  if (postDeleteRes.status !== 404) {
    throw new Error("Deleted report is still accessible!");
  }
  console.log("✅ Deleted report is 404 Not Found.");

  console.log("\n🎉 ALL E2E ANONYMOUS REPORTING & TRACKING TESTS PASSED PERFECTLY!");
}

main().catch((err) => {
  console.error("❌ E2E test failed:", err);
  process.exit(1);
});
