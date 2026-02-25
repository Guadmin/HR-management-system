import pg from "pg";
import bcrypt from "bcryptjs";

const { Client } = pg;

const PG_CONFIG = {
  host: "localhost",
  port: 51214,
  user: "postgres",
  password: "postgres",
  database: "template1",
  ssl: false,
};

// Execute multiple SQL statements using a single client connection
async function sql(queries: string[]): Promise<pg.QueryResult[]> {
  const client = new Client(PG_CONFIG);
  await client.connect();
  const results: pg.QueryResult[] = [];
  for (const q of queries) {
    results.push(await client.query(q));
  }
  await client.end();
  return results;
}

// Execute a single query and return rows
async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  q: string,
  values?: unknown[]
): Promise<T[]> {
  const client = new Client(PG_CONFIG);
  await client.connect();
  const result = await client.query<T>(q, values);
  await client.end();
  return result.rows;
}

function cuid(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${random}`;
}

function esc(s: string): string {
  return s.replace(/'/g, "''");
}

async function main() {
  console.log("🌱 シードデータを投入中...");

  await sql([`
    TRUNCATE TABLE
      notifications, calibration_notes, career_aspirations, development_plans,
      development_areas, strengths, career_design_sheets, mid_term_feedback_items,
      mid_term_feedbacks, overall_evaluations, goal_evaluations, evaluations,
      goal_comments, goal_progress, goals, goal_sheets, evaluation_phases,
      evaluation_periods, team_members, teams, sessions, accounts, users, departments
    RESTART IDENTITY CASCADE
  `]);
  console.log("✅ 既存データを削除しました");

  const password = await bcrypt.hash("password123", 10);

  // ===== Departments =====
  const dept1Id = cuid();
  const dept2Id = cuid();
  const dept3Id = cuid();

  await sql([
    `INSERT INTO departments (id, name, code, "createdAt", "updatedAt") VALUES ('${dept1Id}', '事業開発本部', 'BD', NOW(), NOW())`,
    `INSERT INTO departments (id, name, code, "createdAt", "updatedAt") VALUES ('${dept2Id}', 'プロダクト本部', 'PD', NOW(), NOW())`,
    `INSERT INTO departments (id, name, code, "createdAt", "updatedAt") VALUES ('${dept3Id}', 'コーポレート本部', 'CP', NOW(), NOW())`,
  ]);
  console.log("✅ 部署を作成しました");

  // ===== Users =====
  const usersData = [
    // HR Admin
    { id: cuid(), name: "田中 管理子", email: "hr.admin@talentflow.jp", role: "HR_ADMIN", empId: "EMP000", jobTitle: "人事部長", deptId: dept3Id, hireDate: "2015-04-01" },
    // Directors
    { id: cuid(), name: "山田 太郎", email: "director1@talentflow.jp", role: "DIRECTOR", empId: "EMP001", jobTitle: "事業開発本部長", deptId: dept1Id, hireDate: "2016-04-01" },
    { id: cuid(), name: "鈴木 花子", email: "director2@talentflow.jp", role: "DIRECTOR", empId: "EMP002", jobTitle: "プロダクト本部長", deptId: dept2Id, hireDate: "2017-04-01" },
    { id: cuid(), name: "佐藤 健一", email: "director3@talentflow.jp", role: "DIRECTOR", empId: "EMP003", jobTitle: "コーポレート本部長", deptId: dept3Id, hireDate: "2016-07-01" },
    // Managers
    { id: cuid(), name: "伊藤 次郎", email: "manager1@talentflow.jp", role: "MANAGER", empId: "EMP004", jobTitle: "営業マネージャー", deptId: dept1Id, hireDate: "2018-04-01" },
    { id: cuid(), name: "渡辺 美咲", email: "manager2@talentflow.jp", role: "MANAGER", empId: "EMP005", jobTitle: "マーケティングマネージャー", deptId: dept1Id, hireDate: "2018-10-01" },
    { id: cuid(), name: "中村 翔太", email: "manager3@talentflow.jp", role: "MANAGER", empId: "EMP006", jobTitle: "エンジニアリングマネージャー", deptId: dept2Id, hireDate: "2017-09-01" },
    { id: cuid(), name: "小林 由美", email: "manager4@talentflow.jp", role: "MANAGER", empId: "EMP007", jobTitle: "デザインマネージャー", deptId: dept2Id, hireDate: "2019-04-01" },
    { id: cuid(), name: "加藤 勇気", email: "manager5@talentflow.jp", role: "MANAGER", empId: "EMP008", jobTitle: "人事マネージャー", deptId: dept3Id, hireDate: "2019-07-01" },
    { id: cuid(), name: "吉田 彩香", email: "manager6@talentflow.jp", role: "MANAGER", empId: "EMP009", jobTitle: "財務マネージャー", deptId: dept3Id, hireDate: "2020-01-01" },
    // Members
    { id: cuid(), name: "高橋 一郎", email: "member1@talentflow.jp", role: "MEMBER", empId: "EMP010", jobTitle: "営業担当", deptId: dept1Id, hireDate: "2020-04-01" },
    { id: cuid(), name: "松本 早苗", email: "member2@talentflow.jp", role: "MEMBER", empId: "EMP011", jobTitle: "営業担当", deptId: dept1Id, hireDate: "2020-04-01" },
    { id: cuid(), name: "井上 拓也", email: "member3@talentflow.jp", role: "MEMBER", empId: "EMP012", jobTitle: "シニア営業", deptId: dept1Id, hireDate: "2020-04-01" },
    { id: cuid(), name: "木村 さとみ", email: "member4@talentflow.jp", role: "MEMBER", empId: "EMP013", jobTitle: "マーケター", deptId: dept1Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "林 大輔", email: "member5@talentflow.jp", role: "MEMBER", empId: "EMP014", jobTitle: "コンテンツマーケター", deptId: dept1Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "清水 奈々", email: "member6@talentflow.jp", role: "MEMBER", empId: "EMP015", jobTitle: "デジタルマーケター", deptId: dept1Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "山本 誠", email: "member7@talentflow.jp", role: "MEMBER", empId: "EMP016", jobTitle: "バックエンドエンジニア", deptId: dept2Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "中島 萌", email: "member8@talentflow.jp", role: "MEMBER", empId: "EMP017", jobTitle: "バックエンドエンジニア", deptId: dept2Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "藤原 隆", email: "member9@talentflow.jp", role: "MEMBER", empId: "EMP018", jobTitle: "シニアエンジニア", deptId: dept2Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "岡田 えり", email: "member10@talentflow.jp", role: "MEMBER", empId: "EMP019", jobTitle: "UIデザイナー", deptId: dept2Id, hireDate: "2020-04-01" },
    { id: cuid(), name: "後藤 悠太", email: "member11@talentflow.jp", role: "MEMBER", empId: "EMP020", jobTitle: "UXデザイナー", deptId: dept2Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "河野 美紀", email: "member12@talentflow.jp", role: "MEMBER", empId: "EMP021", jobTitle: "グラフィックデザイナー", deptId: dept2Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "斎藤 光", email: "member13@talentflow.jp", role: "MEMBER", empId: "EMP022", jobTitle: "人事スタッフ", deptId: dept3Id, hireDate: "2020-04-01" },
    { id: cuid(), name: "長谷川 遥", email: "member14@talentflow.jp", role: "MEMBER", empId: "EMP023", jobTitle: "採用担当", deptId: dept3Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "池田 雄介", email: "member15@talentflow.jp", role: "MEMBER", empId: "EMP024", jobTitle: "労務担当", deptId: dept3Id, hireDate: "2021-04-01" },
    { id: cuid(), name: "石川 千恵", email: "member16@talentflow.jp", role: "MEMBER", empId: "EMP025", jobTitle: "経理担当", deptId: dept3Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "前田 敬", email: "member17@talentflow.jp", role: "MEMBER", empId: "EMP026", jobTitle: "財務分析担当", deptId: dept3Id, hireDate: "2022-04-01" },
    { id: cuid(), name: "村田 るみ", email: "member18@talentflow.jp", role: "MEMBER", empId: "EMP027", jobTitle: "会計担当", deptId: dept3Id, hireDate: "2022-04-01" },
  ];

  // Batch insert all users
  const userInserts = usersData.map(u =>
    `INSERT INTO users (id, name, email, password, role, "employeeId", "jobTitle", "departmentId", "hireDate", "createdAt", "updatedAt") VALUES ('${u.id}', '${esc(u.name)}', '${u.email}', '${esc(password)}', '${u.role}'::"UserRole", '${u.empId}', '${esc(u.jobTitle)}', '${u.deptId}', '${u.hireDate}', NOW(), NOW())`
  );
  await sql(userInserts);
  console.log("✅ ユーザーを作成しました");

  // Aliases
  const hrAdmin = usersData[0];
  const dir1 = usersData[1], dir2 = usersData[2], dir3 = usersData[3];
  const managers = usersData.slice(4, 10);
  const members = usersData.slice(10);

  // Update department directors
  await sql([
    `UPDATE departments SET "directorId" = '${dir1.id}' WHERE id = '${dept1Id}'`,
    `UPDATE departments SET "directorId" = '${dir2.id}' WHERE id = '${dept2Id}'`,
    `UPDATE departments SET "directorId" = '${dir3.id}' WHERE id = '${dept3Id}'`,
  ]);

  // ===== Teams =====
  const teamDefs = [
    { id: cuid(), name: "営業チームA", deptId: dept1Id, mgrIdx: 0 },
    { id: cuid(), name: "マーケティングチーム", deptId: dept1Id, mgrIdx: 1 },
    { id: cuid(), name: "バックエンドチーム", deptId: dept2Id, mgrIdx: 2 },
    { id: cuid(), name: "デザインチーム", deptId: dept2Id, mgrIdx: 3 },
    { id: cuid(), name: "人事チーム", deptId: dept3Id, mgrIdx: 4 },
    { id: cuid(), name: "財務チーム", deptId: dept3Id, mgrIdx: 5 },
  ];

  await sql(teamDefs.map(t =>
    `INSERT INTO teams (id, name, "departmentId", "managerId", "createdAt", "updatedAt") VALUES ('${t.id}', '${t.name}', '${t.deptId}', '${managers[t.mgrIdx].id}', NOW(), NOW())`
  ));

  // Team members
  const memberTeamMap = [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5];
  const teamMemberInserts: string[] = [];
  // Managers in their teams
  for (let i = 0; i < managers.length; i++) {
    const tmId = cuid();
    teamMemberInserts.push(`INSERT INTO team_members (id, "userId", "teamId", "startDate", "createdAt") VALUES ('${tmId}', '${managers[i].id}', '${teamDefs[i].id}', NOW(), NOW())`);
  }
  // Members in their teams
  for (let i = 0; i < members.length; i++) {
    const tmId = cuid();
    teamMemberInserts.push(`INSERT INTO team_members (id, "userId", "teamId", "startDate", "createdAt") VALUES ('${tmId}', '${members[i].id}', '${teamDefs[memberTeamMap[i]].id}', NOW(), NOW())`);
  }
  await sql(teamMemberInserts);
  console.log("✅ チームとメンバーを作成しました");

  // ===== Evaluation Period =====
  const periodId = cuid();
  await sql([
    `INSERT INTO evaluation_periods (id, name, "startDate", "endDate", status, "createdAt", "updatedAt") VALUES ('${periodId}', '2025年度上期', '2025-04-01', '2025-09-30', 'ACTIVE', NOW(), NOW())`,
  ]);

  const phases = [
    { phaseType: "GOAL_SETTING", start: "2025-04-01", end: "2025-04-21", active: false },
    { phaseType: "MID_REVIEW", start: "2025-07-01", end: "2025-07-14", active: false },
    { phaseType: "GOAL_REVISION", start: "2025-07-15", end: "2025-07-21", active: false },
    { phaseType: "FINAL_EVALUATION", start: "2025-09-01", end: "2025-09-30", active: true },
  ];
  await sql(phases.map(ph =>
    `INSERT INTO evaluation_phases (id, "evaluationPeriodId", "phaseType", "startDate", "endDate", "isActive", "createdAt", "updatedAt") VALUES ('${cuid()}', '${periodId}', '${ph.phaseType}'::"PhaseType", '${ph.start}', '${ph.end}', ${ph.active}, NOW(), NOW())`
  ));
  console.log("✅ 評価期間を作成しました");

  // ===== Goal Sheets & Goals =====
  const allEmployees = [...members, ...managers];
  const statusList = ["APPROVED", "APPROVED", "APPROVED", "SUBMITTED", "DRAFT"];

  const goalSheetInserts: string[] = [];
  const goalInserts: string[] = [];
  const progressInserts: string[] = [];

  const sheetIds: string[] = [];
  const sheetStatuses: string[] = [];
  const sheetUserIds: string[] = [];

  // Store goal IDs by sheet index for later use
  const goalIdsBySheet: string[][] = [];

  const goalTemplates = [
    { cat: "P_GOAL", title: "売上目標 120% 達成", desc: "担当顧客の売上を前期比120%に拡大する。既存顧客のアップセルと新規開拓の両輪で達成を目指す。", kpi: "四半期売上: 1,200万円 / 年間目標: 5,000万円", weight: 60, order: 0 },
    { cat: "P_GOAL", title: "新規顧客獲得 20社", desc: "新規マーケットへの参入を推進し、新規顧客20社の獲得を目指す。", kpi: "月次新規顧客数: 4社 / 四半期新規顧客数: 12社", weight: 40, order: 1 },
    { cat: "V_GOAL_1", title: "顧客提案資料の質向上", desc: "顧客ニーズに合わせた提案資料を作成し、提案の成功率を高める。", kpi: "提案成功率 60% 以上", weight: 50, order: 0 },
    { cat: "V_GOAL_1", title: "週次レポートの精度向上", desc: "進捗レポートの精度を高め、マネージャーへの報告品質を改善する。", kpi: "週次レポートの遅延ゼロ、指摘件数 月平均2件以下", weight: 50, order: 1 },
    { cat: "V_GOAL_2", title: "プレゼンテーションスキル向上", desc: "社外研修への参加とオンライン学習を通じてプレゼン力を高める。", kpi: "研修参加2回 / 社内発表1回実施", weight: 100, order: 0 },
  ];

  for (let ei = 0; ei < allEmployees.length; ei++) {
    const emp = allEmployees[ei];
    const status = statusList[ei % statusList.length];
    const sheetId = cuid();
    sheetIds.push(sheetId);
    sheetStatuses.push(status);
    sheetUserIds.push(emp.id);

    const submittedAt = status !== "DRAFT" ? `'2025-04-15'` : "NULL";
    const approvedAt = status === "APPROVED" ? `'2025-04-18'` : "NULL";
    goalSheetInserts.push(
      `INSERT INTO goal_sheets (id, "userId", "evaluationPeriodId", status, "submittedAt", "approvedAt", "createdAt", "updatedAt") VALUES ('${sheetId}', '${emp.id}', '${periodId}', '${status}'::"GoalSheetStatus", ${submittedAt}, ${approvedAt}, NOW(), NOW())`
    );

    const sheetGoalIds: string[] = [];
    for (const gt of goalTemplates) {
      const goalId = cuid();
      sheetGoalIds.push(goalId);
      goalInserts.push(
        `INSERT INTO goals (id, "goalSheetId", category, title, description, "kpiDescription", weight, "orderIndex", "isDeleted", "createdAt", "updatedAt") VALUES ('${goalId}', '${sheetId}', '${gt.cat}'::"GoalCategory", '${esc(gt.title)}', '${esc(gt.desc)}', '${esc(gt.kpi)}', ${gt.weight}, ${gt.order}, false, NOW(), NOW())`
      );
      if (status === "APPROVED" && gt.cat === "P_GOAL") {
        const rate = 30 + (ei * 7 % 50);
        progressInserts.push(
          `INSERT INTO goal_progress (id, "goalId", "recordedById", "progressRate", comment, "recordedAt", "createdAt") VALUES ('${cuid()}', '${goalId}', '${emp.id}', ${rate}, '現在の進捗: ${rate}%。引き続き取り組みます。', '2025-07-01', NOW())`
        );
      }
    }
    goalIdsBySheet.push(sheetGoalIds);
  }

  await sql(goalSheetInserts);
  await sql(goalInserts);
  if (progressInserts.length > 0) await sql(progressInserts);
  console.log("✅ 目標シートを作成しました");

  // ===== Evaluations for first 3 APPROVED sheets =====
  const approvedIdxs = sheetStatuses.map((s, i) => s === "APPROVED" ? i : -1).filter(i => i >= 0).slice(0, 3);
  const scores = ["A", "B", "A", "S", "B"];

  for (const idx of approvedIdxs) {
    const sheetId = sheetIds[idx];
    const userId = sheetUserIds[idx];
    const evalId = cuid();
    const goalIds = goalIdsBySheet[idx];

    await sql([
      `INSERT INTO evaluations (id, "goalSheetId", "evaluatorId", type, status, "submittedAt", "createdAt", "updatedAt") VALUES ('${evalId}', '${sheetId}', '${userId}', 'SELF'::"EvaluationType", 'SUBMITTED'::"EvaluationStatus", '2025-09-05', NOW(), NOW())`
    ]);

    const evalItemInserts = goalIds.map((goalId, i) =>
      `INSERT INTO goal_evaluations (id, "evaluationId", "goalId", score, comment, "createdAt", "updatedAt") VALUES ('${cuid()}', '${evalId}', '${goalId}', '${scores[i % scores.length]}'::"AchievementScore", '目標達成に向けて取り組みました。', NOW(), NOW())`
    );
    if (evalItemInserts.length > 0) await sql(evalItemInserts);

    await sql([
      `INSERT INTO overall_evaluations (id, "evaluationId", "overallScore", "overallComment", "strengthComment", "issueComment", "createdAt", "updatedAt") VALUES ('${cuid()}', '${evalId}', 'A'::"AchievementScore", '今期は主要目標を概ね達成できました。', '顧客との関係構築に強みがあります。', 'データ分析スキルをさらに伸ばしたいです。', NOW(), NOW())`
    ]);
  }
  console.log("✅ 評価データを作成しました");

  // ===== Mid-term Feedbacks =====
  const feedbackIdxs = sheetStatuses.map((s, i) => s === "APPROVED" ? i : -1).filter(i => i >= 0).slice(0, 5);

  for (const idx of feedbackIdxs) {
    const sheetId = sheetIds[idx];
    const userId = sheetUserIds[idx];

    const tmRows = await query<{ teamId: string }>(
      `SELECT "teamId" FROM team_members WHERE "userId" = $1 AND "endDate" IS NULL LIMIT 1`, [userId]
    );
    if (!tmRows.length) continue;

    const teamRows = await query<{ managerId: string }>(
      `SELECT "managerId" FROM teams WHERE id = $1`, [tmRows[0].teamId]
    );
    if (!teamRows.length || !teamRows[0].managerId) continue;
    const managerId = teamRows[0].managerId;

    // Use in-memory goal IDs (first 3 goals)
    const goalIds = goalIdsBySheet[idx].slice(0, 3);
    if (!goalIds.length) continue;

    const fbId = cuid();
    await sql([
      `INSERT INTO mid_term_feedbacks (id, "goalSheetId", "feedbackGiverId", "overallComment", "meetingDate", "createdAt", "updatedAt") VALUES ('${fbId}', '${sheetId}', '${managerId}', '順調に進捗しています。後半は新規開拓にさらに力を入れてください。', '2025-07-10', NOW(), NOW())`
    ]);

    const fbStatuses = ["ON_TRACK", "SLIGHTLY_BEHIND", "ON_TRACK"];
    const fbItemInserts = goalIds.map((goalId, i) => {
      const comment = i === 1 ? "進捗がやや遅れています。優先度を上げて取り組んでください。" : "順調に進んでいます。この調子で続けてください。";
      const action = i === 1 ? `'週次で進捗を報告してください'` : "NULL";
      return `INSERT INTO mid_term_feedback_items (id, "feedbackId", "goalId", "progressStatus", comment, "recommendedAction", "createdAt", "updatedAt") VALUES ('${cuid()}', '${fbId}', '${goalId}', '${fbStatuses[i % fbStatuses.length]}'::"FeedbackProgressStatus", '${esc(comment)}', ${action}, NOW(), NOW())`;
    });
    if (fbItemInserts.length > 0) await sql(fbItemInserts);
  }
  console.log("✅ 中間フィードバックを作成しました");

  // ===== Career Design Sheets for first 3 members =====
  for (let i = 0; i < 3; i++) {
    const member = members[i];
    const teamRows = await query<{ managerId: string }>(
      `SELECT t."managerId" FROM teams t JOIN team_members tm ON tm."teamId" = t.id WHERE tm."userId" = $1 AND tm."endDate" IS NULL LIMIT 1`,
      [member.id]
    );
    if (!teamRows.length || !teamRows[0].managerId) continue;
    const managerId = teamRows[0].managerId;

    const sheetId = cuid();
    await sql([
      `INSERT INTO career_design_sheets (id, "subjectUserId", "createdById", "evaluationPeriodId", status, "createdAt", "updatedAt") VALUES ('${sheetId}', '${member.id}', '${managerId}', '${periodId}', 'PUBLISHED', NOW(), NOW())`,
      `INSERT INTO strengths (id, "sheetId", content, evidence, "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', '顧客コミュニケーション能力', '複数の顧客から高評価を獲得。顧客満足度調査で90点以上を継続', 0, NOW(), NOW())`,
      `INSERT INTO strengths (id, "sheetId", content, evidence, "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', '問題解決力', 'クレーム対応で顧客を失うことなく問題を解決した経験複数回', 1, NOW(), NOW())`,
      `INSERT INTO development_areas (id, "sheetId", content, "currentLevel", "targetLevel", "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', 'データ分析スキル', 2, 4, 0, NOW(), NOW())`,
      `INSERT INTO development_areas (id, "sheetId", content, "currentLevel", "targetLevel", "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', 'プロジェクトマネジメント', 2, 3, 1, NOW(), NOW())`,
      `INSERT INTO development_plans (id, "sheetId", action, "dueDate", "ownerId", status, "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', 'データ分析研修への参加', '2025-08-31', '${member.id}', 'IN_PROGRESS', 0, NOW(), NOW())`,
      `INSERT INTO development_plans (id, "sheetId", action, "dueDate", "ownerId", status, "orderIndex", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', 'PMPの資格取得を検討する', '2025-12-31', '${member.id}', 'PLANNED', 1, NOW(), NOW())`,
      `INSERT INTO career_aspirations (id, "sheetId", "shortTermGoal", "longTermGoal", "memberComment", "managerComment", "createdAt", "updatedAt") VALUES ('${cuid()}', '${sheetId}', '1-2年でチームリーダーとしての役割を担えるよう力をつける', '3-5年で事業企画・戦略立案に携わるポジションを目指す', '様々な部署の仕事を経験して幅広い視点を身につけたい', '強みを活かしながら、弱点を計画的に補強していきましょう', NOW(), NOW())`,
    ]);
  }
  console.log("✅ キャリアデザインシートを作成しました");

  // ===== Notifications =====
  await sql([
    `INSERT INTO notifications (id, "userId", type, title, body, "linkUrl", "isRead", "createdAt") VALUES ('${cuid()}', '${members[0].id}', 'GOAL_APPROVED'::"NotificationType", '目標シートが承認されました', 'マネージャーが目標シートを承認しました。', '/goals', false, NOW())`,
    `INSERT INTO notifications (id, "userId", type, title, body, "linkUrl", "isRead", "createdAt") VALUES ('${cuid()}', '${members[0].id}', 'FEEDBACK_RECEIVED'::"NotificationType", '中間フィードバックを受領しました', 'マネージャーから中間フィードバックが届きました。', '/feedback', false, NOW())`,
    `INSERT INTO notifications (id, "userId", type, title, body, "linkUrl", "isRead", "createdAt") VALUES ('${cuid()}', '${managers[0].id}', 'GOAL_SUBMITTED'::"NotificationType", '目標シートが提出されました', '${esc(members[0].name)}さんが目標シートを提出しました。', '/goals/review', false, NOW())`,
  ]);
  console.log("✅ 通知データを作成しました");

  console.log("\n✨ シードデータの投入が完了しました！");
  console.log("\nデモアカウント:");
  console.log("  HR管理者: hr.admin@talentflow.jp / password123");
  console.log("  部門長:   director1@talentflow.jp / password123");
  console.log("  マネージャー: manager1@talentflow.jp / password123");
  console.log("  一般社員: member1@talentflow.jp / password123");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
