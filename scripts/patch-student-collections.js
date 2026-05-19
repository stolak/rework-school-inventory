const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/pages/StudentItemCollections.tsx");
const content = fs.readFileSync(filePath, "utf8");
const marker = "  const groupedBatches = collections.reduce";
const idx = content.indexOf(marker);
if (idx === -1) throw new Error("marker not found");
const headEnd = content.lastIndexOf("  }>())", idx) + "  }>())".length;
const head = content.slice(0, headEnd);

const tail = `
  const selectedStudentForEntry =
    classStudents.find((s) => s.id === selectedStudentId) ??
    allStudents.find((s) => s.id === selectedStudentId)

  return (
    <motion.div className="container mx-auto p-6 space-y-6">
      PLACEHOLDER
    </motion.div>
  )
}
`;

fs.writeFileSync(filePath, head + tail);
console.log("patched head length", head.length);
