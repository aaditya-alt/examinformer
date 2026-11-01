const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/admin/page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add imports if not present
if (!code.includes('MessageSquare')) {
  code = code.replace(
    /Edit3,\s*Download\s*\}/,
    'Edit3,\n  Download,\n  Trash2,\n  Plus,\n  MessageSquare,\n  Star\n}'
  );
}

// 2. Add 'reviews' to activeTab union and add review state
if (!code.includes("'reviews'")) {
  code = code.replace(
    "const [activeTab, setActiveTab] = useState<'shifts' | 'difficulty' | 'users' | 'activity' | 'reports' | 'attempts'>('shifts');",
    `const [activeTab, setActiveTab] = useState<'shifts' | 'difficulty' | 'users' | 'activity' | 'reports' | 'attempts' | 'reviews'>('shifts');
  const [studentReviews, setStudentReviews] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    student_name: '',
    exam_title: '',
    review_category: 'Mock Test Interface',
    rating: 5,
    review_text: '',
    avatar_url: '',
    is_published: true,
    order_index: 0
  });
  const [savingReview, setSavingReview] = useState(false);`
  );
}

// 3. Update fetchDashboardData to load student reviews
if (!code.includes('if (Array.isArray(json.studentReviews)) setStudentReviews(json.studentReviews);')) {
  code = code.replace(
    'if (json.success) {\n        setData(json);\n      }',
    `if (json.success) {
        setData(json);
        if (Array.isArray(json.studentReviews)) setStudentReviews(json.studentReviews);
      }`
  );
}

// 4. Add review handlers before handleGenerateBenchmarks
if (!code.includes('handleOpenAddReview')) {
  const handlers = `  const handleOpenAddReview = () => {
    setEditingReview(null);
    setReviewForm({
      student_name: '',
      exam_title: '',
      review_category: 'Mock Test Interface',
      rating: 5,
      review_text: '',
      avatar_url: '',
      is_published: true,
      order_index: studentReviews.length + 1
    });
    setReviewModalOpen(true);
  };

  const handleOpenEditReview = (r: any) => {
    setEditingReview(r);
    setReviewForm({
      student_name: r.student_name || '',
      exam_title: r.exam_title || '',
      review_category: r.review_category || 'Mock Test Interface',
      rating: r.rating || 5,
      review_text: r.review_text || '',
      avatar_url: r.avatar_url || '',
      is_published: r.is_published !== false,
      order_index: r.order_index || 0
    });
    setReviewModalOpen(true);
  };

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      if (editingReview) {
        const res = await fetch('/api/reviews', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingReview.id, ...reviewForm })
        });
        const json = await res.json();
        if (json.success) {
          setReviewModalOpen(false);
          fetchDashboardData();
        } else {
          alert(json.error || 'Failed to update review');
        }
      } else {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reviewForm)
        });
        const json = await res.json();
        if (json.success) {
          setReviewModalOpen(false);
          fetchDashboardData();
        } else {
          alert(json.error || 'Failed to add review');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error saving review');
    } finally {
      setSavingReview(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student review?')) return;
    try {
      const res = await fetch('/api/reviews?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchDashboardData();
      }
    } catch (e: any) {
      alert(e.message || 'Error deleting review');
    }
  };

  const handleToggleReviewPublish = async (r: any) => {
    try {
      await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: r.id, is_published: !r.is_published })
      });
      fetchDashboardData();
    } catch (e) {}
  };

  const handleGenerateBenchmarks`;

  code = code.replace('  const handleGenerateBenchmarks', handlers);
}

// 5. Add reviews tab button after attempts button
if (!code.includes("setActiveTab('reviews')")) {
  const targetBtn = `          <button
            onClick={() => setActiveTab('attempts')}`;
  const replacementBtn = `          <button
            onClick={() => setActiveTab('reviews')}
            className={\`pb-3 border-b-2 flex items-center gap-2 transition whitespace-nowrap cursor-pointer \${
              activeTab === 'reviews'
                ? 'border-red-600 text-red-600 dark:text-red-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }\`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Student Reviews ({studentReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attempts')}`;

  code = code.replace(targetBtn, replacementBtn);
}

// 6. Add the reviews panel and review modal before the final closing tag of the return
if (!code.includes("{activeTab === 'reviews' && (")) {
  const reviewsPanelAndModal = `        {/* ── TAB 6: STUDENT REVIEWS MANAGEMENT ── */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-violet-500" />
                  <span>Student Reviews &amp; Feedback ({studentReviews.length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Manage genuine aspirant reviews displayed on homepage. Add, edit, reorder or publish/unpublish directly.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddReview}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student Review</span>
              </button>
            </div>

            {studentReviews.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">No Reviews Added Yet</h4>
                <p className="text-xs text-slate-500 mt-1">Click &quot;Add Student Review&quot; to publish your first genuine review.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentReviews.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                          {r.review_category}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleReviewPublish(r)}
                            className={\`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition cursor-pointer \${
                              r.is_published !== false
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }\`}
                          >
                            {r.is_published !== false ? 'Published' : 'Draft'}
                          </button>
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[...Array(r.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                        &ldquo;{r.review_text}&rdquo;
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={r.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                          alt={r.student_name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {r.student_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {r.exam_title}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditReview(r)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Edit Review"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(r.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Review Create/Edit Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {editingReview ? 'Edit Student Review' : 'Add New Student Review'}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Student Name</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.student_name}
                    onChange={(e) => setReviewForm({ ...reviewForm, student_name: e.target.value })}
                    placeholder="e.g. Vikram Singh"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Exam Title / Credential</label>
                  <input
                    type="text"
                    required
                    value={reviewForm.exam_title}
                    onChange={(e) => setReviewForm({ ...reviewForm, exam_title: e.target.value })}
                    placeholder="e.g. Selected RRB NTPC Grad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Feedback Category</label>
                  <select
                    value={reviewForm.review_category}
                    onChange={(e) => setReviewForm({ ...reviewForm, review_category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Mock Test Interface">Mock Test Interface</option>
                    <option value="Website Experience">Website Experience</option>
                    <option value="Question Quality">Question Quality</option>
                    <option value="Performance Analysis">Performance Analysis</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Rating (1 to 5 Stars)</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                    <option value="3">⭐⭐⭐ (3 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Review Quotation</label>
                <textarea
                  required
                  rows={3}
                  value={reviewForm.review_text}
                  onChange={(e) => setReviewForm({ ...reviewForm, review_text: e.target.value })}
                  placeholder="Student feedback on website, test interface, or questions..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Avatar Image URL (Optional)</label>
                <input
                  type="url"
                  value={reviewForm.avatar_url}
                  onChange={(e) => setReviewForm({ ...reviewForm, avatar_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={reviewForm.is_published}
                    onChange={(e) => setReviewForm({ ...reviewForm, is_published: e.target.checked })}
                    className="rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span>Published on Homepage</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingReview}
                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {savingReview ? 'Saving...' : editingReview ? 'Save Changes' : 'Add Review'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}`;

  // Find the closing </div> of the main page container right before {/* Question Fix Modal */}
  code = code.replace(
    /(\n\s*<\/div>\s*)\n\s*\{\/\* Question Fix Modal \*\/\}/,
    '\n' + reviewsPanelAndModal + '\n\n      {/* Question Fix Modal */}'
  );
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched admin/page.tsx with reviews management!');
